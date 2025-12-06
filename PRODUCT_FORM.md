# Product Form Documentation

## Overview

The comprehensive product add/edit form has been created at `/dashboard/products/add` matching the design from the screenshots.

## Features

### 1. Product Information Section
- **Store** - Dropdown to select store (required)
- **Warehouse** - Dropdown to select warehouse (required)
- **Product Name** - Text input for product name (required)
- **Slug** - URL-friendly product identifier (required)
- **SKU** - Stock Keeping Unit with auto-generate button (required)
- **Selling Type** - Retail/Wholesale selection (required)
- **Category** - Dropdown with "Add New" option (required)
- **Sub Category** - Dropdown filtered by category (required)
- **Brand** - Brand selection dropdown (required)
- **Unit** - Measurement unit dropdown (required)
- **Barcode Symbology** - Barcode type selection (CODE128, CODE39, EAN13, UPC)
- **Item Barcode** - Barcode number with auto-generate button (required)
- **Description** - Rich text editor with formatting toolbar (Maximum 60 words)

### 2. Pricing & Stocks Section
- **Product Type** - Radio buttons for Single/Variable product
- **Quantity** - Stock quantity (required)
- **Price** - Product price (required)
- **Tax Type** - Exclusive/Inclusive selection (required)
- **Tax** - Tax percentage dropdown (required)
- **Discount Type** - Percentage/Fixed selection (required)
- **Discount Value** - Discount amount (required)

### 3. Product Images
- Multiple image upload with drag & drop support
- Image preview with remove option
- Visual "Add Images" button

### 4. Custom Fields (Tabbed Section)
Three tabs for additional product information:

#### Warranties Tab
- Warranty selection dropdown (1 Year, 2 Years, 3 Years)

#### Manufacturer Tab
- Manufacturer dropdown
- Manufactured Date picker

#### Expiry Tab
- Expiry Date picker

## Form Validation

All required fields are marked with red asterisk (*) and validated on submit.

## Auto-Generate Features

### SKU Generator
- Generates format: PT#### (e.g., PT0001, PT0234)
- Click "Generate" button next to SKU field

### Barcode Generator
- Generates 12-digit barcode number
- Click "Generate" button next to Item Barcode field

## Form Actions

- **Cancel** - Returns to product list without saving
- **Add Product** - Submits form and creates new product

## API Integration

The form is ready to integrate with your Java REST API. Update the submit handler in:
```
/app/dashboard/products/add/page.tsx
```

## Usage

1. Navigate to Products page: `/dashboard/products`
2. Click "Add Product" button (orange)
3. Fill in all required fields
4. Upload product images (optional)
5. Set custom fields (optional)
6. Click "Add Product" to save

## Quick Add vs Full Add

- **Quick Add** (Blue button) - Opens modal with basic fields
- **Add Product** (Orange button) - Opens full page form with all fields

## Responsive Design

The form is fully responsive:
- Mobile: Single column layout
- Tablet: 2-column grid for most fields
- Desktop: Optimized 2-3 column layout

## Color Scheme

- Primary Action: Orange (#F97316)
- Secondary Action: Indigo (#4F46E5)
- Cancel/Neutral: Gray
- Required Indicator: Red (#EF4444)

## Type Definitions

Updated Product interface in `/types/index.ts` includes:
- All form fields
- Optional and required properties
- Product type union ('single' | 'variable')
- Image array support
