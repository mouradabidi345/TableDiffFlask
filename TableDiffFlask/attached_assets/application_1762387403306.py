
##### always kill the terminal , then create a new terminal before runing the application
import pandas as pd
# import xlrd 
import sqlalchemy
# import math
from sqlalchemy import create_engine
#from pandas_profiling import ProfileReport
from snowflake.connector.pandas_tools import write_pandas
# import snowflake.connector
import numpy as np
import win32com.client as client
import datetime
import datacompy
import snowflake.connector
from flask import Flask, request, render_template,request
import pythoncom
from pydantic_settings import BaseSettings
from pydantic import BaseModel, ConfigDict, PydanticUserError, create_model, AnyUrl





# Flask constructor
application = Flask(__name__)  



#new
join_column_list =[]
def combinedPrimary_key(Primary_key1, Primary_key2, Primary_key3 ,Primary_key4 ):
    
    if ((not Primary_key1 =="") and (not Primary_key2 =="") and (Primary_key3 =="") and (Primary_key4 =="") ):
        join_column_list.insert(0,Primary_key1)
        join_column_list.insert(1,Primary_key2)
        return join_column_list
    
    elif ((not Primary_key1 =="") and (not Primary_key2 =="") and (not Primary_key3 =="")  and (Primary_key4 =="") ):
        join_column_list.insert(0,Primary_key1)
        join_column_list.insert(1,Primary_key2)
        join_column_list.insert(2,Primary_key3)
        return join_column_list
    
    elif ((not Primary_key1 =="") and (not Primary_key2 =="") and (not Primary_key3 =="") and (not Primary_key4 =="")):
        join_column_list.insert(0,Primary_key1)
        join_column_list.insert(1,Primary_key2)
        join_column_list.insert(2,Primary_key3)
        join_column_list.insert(3,Primary_key4)
        return join_column_list
    
    else:    
        join_columns = Primary_key1
        return join_columns







#SnowflakeVS SnowFlake:
def  SnowflakeQA(WAREHOUSE1,Columns1 , DATABASE1, SCHEMA1, Table1,filter1,WAREHOUSE2,Columns2, DATABASE2, SCHEMA2,  Table2, filter2,Primary_key1, Primary_key2 , Primary_key3,Primary_key4, Email_Address): #new
    #print(Primary_key1, Primary_key2)
    ctx1 = snowflake.connector.connect(
          user= '' ,  #### 'DBT_USER',
          password= '' ,   ##### 't#KsHXIx3$F0F&Ru',
          account='',
          warehouse1= WAREHOUSE1,
          database1=DATABASE1,
          schema1=SCHEMA1
          )    

    ctx2 = snowflake.connector.connect(
          user= '' , ####'DBT_USER',
          password= '' , #####  't#KsHXIx3$F0F&Ru',
          account='',
          warehouse2= WAREHOUSE2,
          database2=DATABASE2,
          schema2=SCHEMA2
          )
  
    cur1 = ctx1.cursor()
    
# # Execute a statement that will generate a result set.
    warehouse1= WAREHOUSE1
    database1= DATABASE1
    schema1=SCHEMA1
    Column1 = Columns1
    Filter1 = filter1

    if warehouse1:
        cur1.execute(f'use warehouse {warehouse1};')
    
    
    
    
    cur1.execute(f'select {Column1} from {database1}.{schema1}.{Table1} {Filter1} ;')
    print(cur1)
    
# Fetch the result set from the cursor and deliver it as the Pandas DataFrame.
    snowflakedf1 = cur1.fetch_pandas_all()
    
    
    cur2 = ctx2.cursor()
    warehouse2= WAREHOUSE2
    database2=DATABASE2
    schema2=SCHEMA2
    Column2 = Columns2
    Filter2 = filter2

    if warehouse2:
        cur2.execute(f'use warehouse {warehouse2};')
    
    cur2.execute(f'select {Column2} from {database2}.{schema2}.{ Table2} {Filter2} ;')


    snowflakedf2 = cur2.fetch_pandas_all()

    
    resultPrimaryKey = combinedPrimary_key(Primary_key1, Primary_key2, Primary_key3, Primary_key4)
    print(resultPrimaryKey)


    compare = datacompy.Compare(
    snowflakedf1,
    snowflakedf2,
    

    join_columns= resultPrimaryKey)
    

    compare.matches(ignore_extra_columns=False) 
    print(compare.report())
    #sqldatabase = 'InfoTrax_Prod'
    # sqldatabase = 'ASEA_PROD'
    # sqldatabase = 'ASEA_REPORTS'
    
    test = datetime.datetime.today()
    Today = test.strftime("%Y-%m-%d %H:%M:%S") #correct
    #Today = datetime.datetime.today() #correct
    pythoncom.CoInitialize()
    outlook = client.Dispatch('Outlook.Application')
    message = outlook.Createitem(0)
   
    message.To = Email_Address
    message.Subject =  'DIFF APP RESULTS: ' + WAREHOUSE1+'.' +DATABASE1+ '.' +SCHEMA1+ '.' +Table1+ '  VS  ' +WAREHOUSE2+ '.' +DATABASE2+ '.' +SCHEMA2+ '.' +Table2 + ' ' + ' as of ' + ' ' + str(Today)
    message.Display()
    message.Body= compare.report()
    # message.Save()
    # message.Display(True)
    message.Save()
    message.Send()


    cur1.close()
    cur2.close()





def Mainfunction(WAREHOUSE1,Columns1, DATABASE1,SCHEMA1,Table1, filter1,WAREHOUSE2,Columns2, DATABASE2,SCHEMA2,Table2,filter2, Primary_key1, Primary_key2 ,Primary_key3, Primary_key4 , Email_Address):
    
 
        
        # result = SnowflakeQA(WAREHOUSE1,Columns1 , DATABASE1, SCHEMA1, Table1,filter1,WAREHOUSE2,Columns2, DATABASE2, SCHEMA2,  Table2, filter2,Primary_key1, Primary_key2, Email_Address) #new
        result = SnowflakeQA(WAREHOUSE1,Columns1 , DATABASE1, SCHEMA1, Table1,filter1,WAREHOUSE2,Columns2, DATABASE2, SCHEMA2,  Table2, filter2,Primary_key1, Primary_key2, Primary_key3, Primary_key4, Email_Address) #new





# ##databricks SqlServer VS Sql server  Working with one Primary key
# job =  Mainfunction("","""*""", 'InfoTrax_Prod','dbo','TBL_MARKETS', """""" ,"","""*""",'ASEA_REPORTS', 'asea_sales_stage', 'TBL_MARKETS', """""", 'ID', '')        #qlServer VS Sql server  Working with one Primary key 

@application.route('/')
def form():
   return render_template('form.html')

@application.route('/',methods = ['POST', 'GET'])
def result():
    if request.method == "POST":
       # getting input with name = fname in HTML form
       WAREHOUSE_1 = request.form.get("WAREHOUSE1")
       # getting input with name = lname in HTML form 
       Columns_1 = request.form.get("Columns1") 
       print(WAREHOUSE_1)
       print(Columns_1)
       DATABASE_1  = request.form.get("DATABASE1") 
       print(DATABASE_1)
       SCHEMA_1 = request.form.get("SCHEMA1")
       WAREHOUSE_2 = request.form.get("WAREHOUSE2") 
       SCHEMA_2  = request.form.get("SCHEMA2") 
       Table_2  = request.form.get("Table2") 
       filter_2  = request.form.get("filter2") 
       Primary_key_1 = request.form.get("Primary_key1") 
       Primary_key_2 = request.form.get("Primary_key2") 
       Primary_key_3 = request.form.get("Primary_key3")
       Primary_key_4 = request.form.get("Primary_key4")
       Table_1 = request.form.get("Table1") 
       filter_1 = request.form.get("filter1") 
       DATABASE_2 = request.form.get("DATABASE2") 
       Columns_2 = request.form.get("Columns2") 
       Email_Address = request.form.get("Email_Address")

       result = Mainfunction(WAREHOUSE_1,Columns_1, DATABASE_1,SCHEMA_1,Table_1, filter_1,WAREHOUSE_2,Columns_2, DATABASE_2,SCHEMA_2,Table_2,filter_2, Primary_key_1, Primary_key_2, Primary_key_3, Primary_key_4 , Email_Address)
    
    return render_template('result.html',result = result)

if __name__=='__main__':
   application.run(debug=True)     
   
   
