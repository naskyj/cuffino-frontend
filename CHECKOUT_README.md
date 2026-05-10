# Checkout System Documentation

## Overview
The checkout system for Cuffino provides a complete e-commerce checkout experience with cart management, order processing, and success confirmation.

## Features

### 🛒 Cart Management
- Add/remove items from cart
- Update quantities
- Real-time total calculation
- Persistent cart storage (localStorage)
- Empty cart state with call-to-action

### 💳 Checkout Process
- **Billing Address**: Complete customer information form
- **Payment Method**: Credit card, Debit card, PayPal options
- **Order Summary**: Real-time order details and totals
- **Form Validation**: Comprehensive validation using Formik + Yup
- **Responsive Design**: Works on all device sizes

### 📦 Order Processing
- Automatic shipping and tax calculation
- Order data persistence
- Success page with order confirmation
- Cart clearing after successful order

## File Structure

```
src/
├── app/
│   ├── cart/
│   │   └── page.jsx              # Cart page with item management
│   └── checkout/
│       ├── page.jsx              # Main checkout form
│       └── success/
│           └── page.jsx          # Order success page
├── components/
│   └── utils/
│       └── OrderSummary.jsx      # Reusable order summary component
└── core/
    └── zustand/
        ├── cart.store.js         # Cart state management
        └── checkout.store.js     # Checkout state management
```

## State Management

### Cart Store (`cart.store.js`)
- `items`: Array of cart items
- `total`: Cart total
- `addToCart(product, quantity)`: Add item to cart
- `removeFromCart(productId)`: Remove item from cart
- `updateQuantity(productId, quantity)`: Update item quantity
- `clearCart()`: Clear all items
- `getCartItemCount()`: Get total item count

### Checkout Store (`checkout.store.js`)
- `orderItems`: Items being purchased
- `orderTotal`, `shippingCost`, `taxAmount`, `finalTotal`: Order totals
- `customerInfo`: Customer details
- `billingAddress`, `shippingAddress`: Address information
- `paymentInfo`: Payment method and card details
- `preferences`: Checkout preferences
- `initializeCheckout(cartItems, cartTotal)`: Initialize checkout
- `processOrder()`: Process the order
- `clearCheckout()`: Clear checkout data

## Usage

### 1. Adding Items to Cart
```javascript
import useCart from "@/core/zustand/cart.store";

const { addToCart } = useCart();

// Add product to cart
addToCart(product, quantity);
```

### 2. Navigating to Checkout
```javascript
// From cart page - automatically navigates to checkout
<Link href="/checkout">
  <button>Checkout</button>
</Link>
```

### 3. Processing Orders
```javascript
import useCheckout from "@/core/zustand/checkout.store";

const { processOrder } = useCheckout();

const handleSubmit = async (values) => {
  const result = await processOrder();
  if (result.success) {
    // Redirect to success page
    router.push(`/checkout/success?orderId=${result.orderId}`);
  }
};
```

## Form Validation

The checkout form includes comprehensive validation:

- **Required Fields**: First name, last name, email, address, zip code
- **Email Validation**: Proper email format
- **Payment Fields**: Card holder name, card number, expiration, CVV
- **Real-time Validation**: Instant feedback on form errors

## Responsive Design

- **Mobile**: Single column layout with stacked form fields
- **Tablet**: Two-column grid for form fields
- **Desktop**: Three-column layout with order summary sidebar
- **Large Screens**: Centered content with optimal spacing

## Customization

### Styling
- Uses Tailwind CSS for styling
- Primary color: `#A86746` (defined in `tailwind.config.js`)
- Consistent with existing design system

### Components
- Reusable `OrderSummary` component
- Form components from `src/components/input/`
- Navigation components from `src/components/navbars/`

### API Integration
To integrate with a real backend API:

1. Update `processOrder()` in `checkout.store.js`
2. Replace the simulated API call with actual API endpoints
3. Add proper error handling for API responses
4. Implement order tracking and status updates

## Future Enhancements

- [ ] Order tracking system
- [ ] Email notifications
- [ ] Multiple payment gateways
- [ ] Address validation
- [ ] Order history
- [ ] Guest checkout option
- [ ] Coupon/discount system
- [ ] Save payment methods
- [ ] International shipping support

## Testing

The checkout system includes:
- Form validation testing
- Responsive design testing
- State management testing
- Error handling testing

To test the checkout flow:
1. Add items to cart from products page
2. Navigate to cart page
3. Click "Checkout" button
4. Fill out the checkout form
5. Submit order
6. Verify success page and order confirmation 