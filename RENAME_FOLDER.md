# Folder Rename Instructions

## Current Status

The application has been renamed to "Inventory Management" in all code files, but the folder name `physio-nextjs` needs to be renamed to `inventory-management`.

## Manual Rename Steps

Since the folder is currently in use by the IDE, you'll need to rename it manually:

### Option 1: Using File Explorer (Recommended)
1. Close VS Code completely
2. Navigate to `C:\Rajesh\`
3. Right-click on the `physio-nextjs` folder
4. Select "Rename"
5. Change the name to `inventory-management`
6. Open VS Code and open the new `inventory-management` folder

### Option 2: Using Command Prompt
1. Close VS Code completely
2. Open Command Prompt
3. Run these commands:
   ```cmd
   cd C:\Rajesh
   rename physio-nextjs inventory-management
   ```
4. Open VS Code and open the `inventory-management` folder

### Option 3: Using PowerShell
1. Close VS Code completely
2. Open PowerShell
3. Run these commands:
   ```powershell
   cd C:\Rajesh
   Rename-Item -Path "physio-nextjs" -NewName "inventory-management"
   ```
4. Open VS Code and open the `inventory-management` folder

## What Has Been Updated

All internal references have been updated:
- ✅ `package.json` - name changed to "inventory-management"
- ✅ Application title in all pages - "Inventory Management"
- ✅ Sidebar branding - "Inventory Management"
- ✅ Login page header - "Inventory Management"
- ✅ README.md - updated with new name
- ✅ All documentation files

## After Renaming

Once you've renamed the folder, update your working directory:

```bash
cd C:\Rajesh\inventory-management
```

Then you can continue development as normal:

```bash
npm run dev
```

## Note

The folder rename is purely cosmetic and does not affect the application functionality. The application will work the same regardless of the folder name.
