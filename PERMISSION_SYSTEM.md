# Permission System Implementation

This document explains how the permission-based access control system works in the Jawda Laundry application.

## Overview

The permission system provides visual feedback when users don't have the required permissions for specific actions. Elements without permissions are displayed with:
- **Red border** around the element
- **"No Permission" badge** in the top-left corner
- **Disabled state** (opacity reduced, cursor not allowed)
- **Tooltip** showing "No permission" message

## Components

### 1. PermissionWrapper
A general-purpose wrapper for any element that requires permission checking.

```tsx
import { PermissionWrapper } from '@/components/ui/permission-wrapper';

<PermissionWrapper 
  permission="order:update" 
  tooltipText="No permission to update orders"
  fallback={<span>Access Denied</span>}
>
  <Button onClick={handleEdit}>Edit Order</Button>
</PermissionWrapper>
```

### 2. PermissionButton
Specialized wrapper for buttons that automatically handles disabled state.

```tsx
import { PermissionButton } from '@/components/ui/permission-wrapper';

<PermissionButton 
  permission="user:delete" 
  onClick={handleDelete}
  variant="destructive"
>
  Delete User
</PermissionButton>
```

### 3. PermissionLink
Specialized wrapper for links and navigation elements.

```tsx
import { PermissionLink } from '@/components/ui/permission-wrapper';

<PermissionLink 
  permission="navigation:view" 
  href="/admin/navigation"
>
  Manage Navigation
</PermissionLink>
```

## Available Permissions

### User Management
- `user:create` - Create new users
- `user:update` - Update existing users
- `user:delete` - Delete users
- `user:assign-roles` - Assign roles to users
- `user-navigation:manage` - Manage user navigation permissions

### Navigation Management
- `navigation:view` - View navigation items
- `navigation:update` - Update navigation items (including reordering and status)
- `navigation:delete` - Delete navigation items

### Order Management
- `order:create` - Create new orders
- `order:update` - Update existing orders
- `order:delete` - Delete orders
- `order:update-status` - Change order status
- `order:record-payment` - Record payments for orders
- `order:send-whatsapp` - Send WhatsApp messages for orders

### Customer Management
- `customer:view` - View customers
- `customer:create` - Create new customers
- `customer:update` - Update customers
- `customer:delete` - Delete customers
- `customer:view-ledger` - View customer ledger

### Supplier Management
- `supplier:create` - Create suppliers
- `supplier:update` - Update suppliers
- `supplier:delete` - Delete suppliers

### Expense Management
- `expense:create` - Create expenses
- `expense:update` - Update expenses
- `expense:delete` - Delete expenses
- `expense-category:manage` - Manage expense categories

### Purchase Management
- `purchase:create` - Create purchases
- `purchase:update` - Update purchases
- `purchase:delete` - Delete purchases

### Reports
- `report:view-financial` - View financial reports
- `report:view-operational` - View operational reports

### Service Management
- `service-admin:manage` - Manage services and sizes

## Implementation Examples

### Navigation Management Page
```tsx
// Drag handle with permission
<PermissionWrapper 
  permission="navigation:update" 
  tooltipText={t('noPermissionToReorderNavigation')}
>
  <div {...attributes} {...listeners}>
    <GripVertical className="h-4 w-4" />
  </div>
</PermissionWrapper>

// Status toggle with permission
<PermissionWrapper 
  permission="navigation:update" 
  tooltipText={t('noPermissionToUpdateNavigation')}
>
  <Checkbox
    checked={item.is_active}
    onCheckedChange={handleToggle}
  />
</PermissionWrapper>
```

### Users List Page
```tsx
// Action button with permission
<PermissionWrapper permission="user:create" fallback={null}>
  <Button onClick={handleCreateUser}>
    Create User
  </Button>
</PermissionWrapper>

// Dropdown menu items with permissions
<PermissionWrapper permission="user:update" fallback={null}>
  <DropdownMenuItem onClick={handleEdit}>
    <Edit3 className="mr-2 h-4 w-4" />
    Edit
  </DropdownMenuItem>
</PermissionWrapper>
```

### Orders Table Row
```tsx
// Payment actions with permission
<PermissionWrapper permission="order:record-payment" fallback={null}>
  <DropdownMenuItem onClick={handlePayments}>
    <CreditCard className="mr-2 h-4 w-4" />
    View Payments
  </DropdownMenuItem>
</PermissionWrapper>
```

## Best Practices

### 1. Use Fallback for Conditional Rendering
Instead of hiding elements completely, use `fallback={null}` to remove them when no permission:

```tsx
// Good - element is removed when no permission
<PermissionWrapper permission="user:delete" fallback={null}>
  <Button variant="destructive">Delete</Button>
</PermissionWrapper>

// Good - shows disabled version when no permission
<PermissionWrapper permission="user:delete">
  <Button variant="destructive">Delete</Button>
</PermissionWrapper>
```

### 2. Provide Clear Tooltips
Always provide descriptive tooltip text for better UX:

```tsx
<PermissionWrapper 
  permission="order:update" 
  tooltipText="No permission to edit orders"
>
  <Button>Edit Order</Button>
</PermissionWrapper>
```

### 3. Use Appropriate Permission Names
Follow the naming convention: `resource:action`

```tsx
// Good
permission="user:create"
permission="order:update"
permission="navigation:delete"

// Avoid
permission="create_user"
permission="updateOrder"
```

### 4. Handle Multiple Permissions
For actions that require multiple permissions, use the most restrictive one:

```tsx
// If user needs both create and update permissions
<PermissionWrapper permission="user:update">
  <UserFormModal />
</PermissionWrapper>
```

## Translation Keys

Add translation keys for permission-related messages:

```json
// en/admin.json
{
  "noPermissionToUpdateNavigation": "No permission to update navigation",
  "noPermissionToReorderNavigation": "No permission to reorder navigation",
  "noPermissionToDeleteNavigation": "No permission to delete navigation"
}

// ar/admin.json
{
  "noPermissionToUpdateNavigation": "لا توجد صلاحية لتحديث التنقل",
  "noPermissionToReorderNavigation": "لا توجد صلاحية لإعادة ترتيب التنقل",
  "noPermissionToDeleteNavigation": "لا توجد صلاحية لحذف التنقل"
}
```

## Testing Permissions

To test the permission system:

1. **Create a test user** with limited permissions
2. **Assign specific roles** to test different permission combinations
3. **Verify visual indicators** appear for restricted actions
4. **Check tooltips** show appropriate messages
5. **Confirm disabled state** prevents interactions

## Security Notes

- **Frontend permissions are for UX only** - Always validate permissions on the backend
- **Admin users bypass all permissions** - They can perform any action
- **Permission checks are client-side** - Don't rely on them for security
- **Backend validation is required** - Always check permissions in API endpoints

## Migration Guide

To migrate existing permission checks:

### Before (Conditional Rendering)
```tsx
{can('user:delete') && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

### After (Permission Wrapper)
```tsx
<PermissionWrapper permission="user:delete" fallback={null}>
  <Button onClick={handleDelete}>Delete</Button>
</PermissionWrapper>
```

### Before (Disabled State)
```tsx
<Button 
  disabled={!can('order:update')}
  onClick={handleEdit}
>
  Edit Order
</Button>
```

### After (Permission Button)
```tsx
<PermissionButton 
  permission="order:update"
  onClick={handleEdit}
>
  Edit Order
</PermissionButton>
```

This system provides consistent, user-friendly feedback for permission restrictions throughout the application.
