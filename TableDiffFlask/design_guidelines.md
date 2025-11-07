# Design Guidelines: Snowflake Table Comparison Tool

## Design Approach

**Selected System**: Material Design  
**Justification**: Ideal for data-dense applications requiring clear visual hierarchy, robust form components, and excellent table displays. Provides professional appearance suitable for data engineering workflows.

**Core Principles**:
- Clarity and efficiency over visual flair
- Information density balanced with readability
- Predictable, learnable interface patterns
- Professional, trustworthy aesthetic

---

## Typography

**Font Family**: Roboto (via Google Fonts CDN)

**Hierarchy**:
- Page Title: 2xl, font-semibold
- Section Headers (Database 1, Database 2, Results): xl, font-medium
- Form Labels: sm, font-medium, uppercase tracking
- Input Text: base, font-normal
- Results Data: sm, font-mono (for technical data), base for descriptive text
- Helper Text: xs, font-normal

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, mb-8)

**Container Strategy**:
- Form page: max-w-6xl mx-auto
- Results page: max-w-7xl mx-auto
- Card padding: p-6 to p-8
- Section spacing: space-y-8 for major sections, space-y-4 for form groups

**Grid Structure**:
- Form inputs: 2-column grid on desktop (grid-cols-2), single column on mobile
- Primary keys: 4-column grid on desktop (grid-cols-4)
- Results tables: Full-width responsive tables with horizontal scroll

---

## Component Library

### Forms & Inputs

**Input Fields**:
- Material Design outlined text fields
- Floating labels that shrink on focus/fill
- Bottom border accent on focus
- Clear error states with helper text below
- Consistent height (h-12)
- Full-width within grid cells

**Form Organization**:
- Database 1 and Database 2 in separate elevated cards (Material elevation-2)
- Visual separator between the two database sections
- Primary Keys section spanning full width below
- Email configuration section at bottom with checkbox for "Send email notification"

**Buttons**:
- Primary action (Compare Tables): Large, full-width or centered, Material raised button style
- Secondary actions (Download Results): Material outlined button
- Clear hierarchy: filled primary, outlined secondary

### Navigation & Header

**Top Bar**:
- Simple header with application title "Snowflake Table Comparator"
- Minimal chrome - focus on workspace
- Optional breadcrumb on results page: Form > Results

### Data Display

**Results Section**:
- Three distinct cards:
  1. **Summary Card**: Match statistics, row counts, key metrics in large numbers
  2. **Differences Table**: Material Data Table with sorting, pagination if needed
  3. **Details Section**: Expandable panels for additional comparison metadata

**Tables**:
- Material Design data table pattern
- Alternating row treatment for readability
- Sticky header on scroll
- Monospace font for data values
- Clear column headers with sorting indicators
- Responsive: Horizontal scroll on mobile with fixed first column

### Feedback & States

**Loading State**:
- Centered Material circular progress indicator
- Overlay with semi-transparent backdrop
- "Comparing tables..." text below spinner
- Blocks interaction during processing

**Empty/Error States**:
- Centered icon + message pattern
- Clear next-step instructions
- Friendly, helpful tone

**Success Confirmation**:
- Material snackbar notification for email sent confirmation
- Non-intrusive, auto-dismissing

---

## Page Layouts

### Form Page

**Structure**:
- Centered container (max-w-6xl)
- Page title with brief description
- Database 1 card (warehouse, database, schema, table, columns, filter inputs)
- Database 2 card (mirror structure)
- Primary Keys section (4 inputs in grid)
- Email section (email input + checkbox toggle)
- Large "Compare Tables" button
- All form fields clearly labeled with helpful placeholder text

### Results Page

**Structure**:
- Page header with comparison title (Database1.Table1 vs Database2.Table2)
- Back to form link
- Summary statistics card at top
- Differences section with tabs/panels: "Rows Only in Database 1", "Rows Only in Database 2", "Mismatched Rows"
- Download button prominently placed
- Timestamp of comparison

---

## Animations

**Minimal Use Only**:
- Smooth page transitions (200ms)
- Button ripple effect (Material standard)
- Loading spinner rotation
- Form validation feedback (shake on error)
- No scroll animations or complex transitions

---

## Accessibility

- All form inputs with proper labels and aria-attributes
- Keyboard navigation support throughout
- Focus indicators on all interactive elements
- Error messages associated with inputs via aria-describedby
- Sufficient contrast ratios for all text
- Screen reader announcements for loading states and results