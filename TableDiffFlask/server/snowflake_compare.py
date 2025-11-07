#!/usr/bin/env python3
"""
Snowflake Table Comparison Script
Compares two Snowflake tables and returns detailed comparison results
"""

import sys
import json
import datetime
import snowflake.connector
import pandas as pd
import numpy as np
import datacompy
from typing import Dict, Any, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


def convert_to_json_serializable(obj):
    """
    Convert numpy/pandas data types to JSON-serializable Python types
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (pd.Timestamp, datetime.datetime)):
        return obj.isoformat()
    elif isinstance(obj, pd.NaT.__class__):
        return None
    elif pd.isna(obj):
        return None
    elif isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    else:
        return obj


def build_primary_keys(key1: str, key2: Optional[str] = None, 
                       key3: Optional[str] = None, key4: Optional[str] = None) -> List[str] | str:
    """Build primary key list from provided keys"""
    keys = [k for k in [key1, key2, key3, key4] if k and k.strip()]
    
    if len(keys) == 0:
        raise ValueError("At least one primary key is required")
    elif len(keys) == 1:
        return keys[0]
    else:
        return keys


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email notification with comparison results"""
    try:
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        from_email = os.environ.get('SMTP_FROM_EMAIL')
        
        if not all([smtp_host, smtp_user, smtp_password, from_email]):
            print("Email configuration incomplete, skipping email send", file=sys.stderr)
            return False
        
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(str(smtp_host), smtp_port)
        server.starttls()
        server.login(str(smtp_user), str(smtp_password))
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}", file=sys.stderr)
        return False


def compare_tables(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare two Snowflake tables and return comparison results
    """
    try:
        # Extract connection details
        user = request_data['snowflakeUser']
        password = request_data['snowflakePassword']
        account = request_data['snowflakeAccount']
        
        # Database 1 details
        warehouse1 = request_data.get('warehouse1', '')
        database1 = request_data['database1']
        schema1 = request_data['schema1']
        table1 = request_data['table1']
        columns1 = request_data.get('columns1', '*')
        filter1 = request_data.get('filter1', '')
        
        # Database 2 details
        warehouse2 = request_data.get('warehouse2', '')
        database2 = request_data['database2']
        schema2 = request_data['schema2']
        table2 = request_data['table2']
        columns2 = request_data.get('columns2', '*')
        filter2 = request_data.get('filter2', '')
        
        # Primary keys
        primary_key1 = request_data['primaryKey1']
        primary_key2 = request_data.get('primaryKey2', '')
        primary_key3 = request_data.get('primaryKey3', '')
        primary_key4 = request_data.get('primaryKey4', '')
        
        # Email configuration
        email_address = request_data.get('emailAddress', '')
        send_email_flag = request_data.get('sendEmail', False)
        
        # Connect to first database
        conn1 = snowflake.connector.connect(
            user=user,
            password=password,
            account=account,
        )
        cursor1 = conn1.cursor()
        
        # Set warehouse and database for connection 1
        if warehouse1:
            cursor1.execute(f'USE WAREHOUSE {warehouse1}')
        cursor1.execute(f'USE DATABASE {database1}')
        cursor1.execute(f'USE SCHEMA {schema1}')
        
        # Query first table
        query1 = f'SELECT {columns1} FROM {database1}.{schema1}.{table1}'
        if filter1:
            query1 += f' {filter1}'
        
        cursor1.execute(query1)
        df1 = cursor1.fetch_pandas_all()
        
        # Connect to second database
        conn2 = snowflake.connector.connect(
            user=user,
            password=password,
            account=account,
        )
        cursor2 = conn2.cursor()
        
        # Set warehouse and database for connection 2
        if warehouse2:
            cursor2.execute(f'USE WAREHOUSE {warehouse2}')
        cursor2.execute(f'USE DATABASE {database2}')
        cursor2.execute(f'USE SCHEMA {schema2}')
        
        # Query second table
        query2 = f'SELECT {columns2} FROM {database2}.{schema2}.{table2}'
        if filter2:
            query2 += f' {filter2}'
        
        cursor2.execute(query2)
        df2 = cursor2.fetch_pandas_all()
        
        # Build primary keys
        join_columns = build_primary_keys(primary_key1, primary_key2, primary_key3, primary_key4)
        
        # Perform comparison using datacompy
        compare = datacompy.Compare(
            df1,
            df2,
            join_columns=join_columns,
            df1_name='Database_1',
            df2_name='Database_2'
        )
        
        # Get comparison report
        report = compare.report()
        
        # Extract summary statistics (convert to native Python ints)
        summary = {
            'totalRows1': int(len(df1)),
            'totalRows2': int(len(df2)),
            'matchingRows': int(len(compare.intersect_rows)),
            'mismatchedRows': int(len(compare.intersect_rows) - compare.count_matching_rows()),
            'onlyInDatabase1': int(len(compare.df1_unq_rows)),
            'onlyInDatabase2': int(len(compare.df2_unq_rows)),
            'columnsCompared': int(len(compare.intersect_columns())),
        }
        
        # Extract structured difference data
        # Rows only in Database 1
        only_in_db1 = []
        if not compare.df1_unq_rows.empty:
            raw_data = compare.df1_unq_rows.head(100).to_dict('records')
            only_in_db1 = convert_to_json_serializable(raw_data)
        
        # Rows only in Database 2
        only_in_db2 = []
        if not compare.df2_unq_rows.empty:
            raw_data = compare.df2_unq_rows.head(100).to_dict('records')
            only_in_db2 = convert_to_json_serializable(raw_data)
        
        # Mismatched rows - get sample of rows with differences
        mismatched_rows = []
        if compare.count_matching_rows() < len(compare.intersect_rows):
            # Get rows that intersect but don't match
            try:
                # Get sample of all columns that differ
                all_mismatch = compare.all_mismatch()
                if not all_mismatch.empty:
                    raw_data = all_mismatch.head(100).to_dict('records')
                    mismatched_rows = convert_to_json_serializable(raw_data)
            except:
                # Fallback if all_mismatch fails
                pass
        
        # Generate timestamp
        timestamp = datetime.datetime.now().isoformat()
        
        # Build database info strings
        db1_info = f"{database1}.{schema1}.{table1}"
        db2_info = f"{database2}.{schema2}.{table2}"
        
        # Send email if requested
        email_sent = False
        if send_email_flag and email_address:
            subject = f"TableMigrationCheck Results: {db1_info} vs {db2_info} - {timestamp}"
            email_sent = send_email(email_address, subject, report)
        
        # Close connections
        cursor1.close()
        cursor2.close()
        conn1.close()
        conn2.close()
        
        # Return results
        return {
            'timestamp': timestamp,
            'database1Info': db1_info,
            'database2Info': db2_info,
            'summary': summary,
            'fullReport': report,
            'onlyInDatabase1': only_in_db1,
            'onlyInDatabase2': only_in_db2,
            'mismatchedRows': mismatched_rows,
            'emailSent': email_sent
        }
        
    except Exception as e:
        raise Exception(f"Comparison failed: {str(e)}")


def main():
    """Main function to handle command line execution"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Perform comparison
        result = compare_tables(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
