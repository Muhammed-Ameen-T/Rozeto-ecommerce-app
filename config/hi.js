async function placeOrder() {
    const orderData = await gatherCheckoutData();
    console.log(orderData)
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.id.split('-')[1];
    console.log(paymentMethod)
    if (paymentMethod === 'COD') {
      if (orderData.totalPrice > 1000) {
          return Swal.fire({
              text: 'Orders above ₹1000 cannot be placed using Cash on Delivery. Please choose a different payment method.',
              icon: 'warning',
              confirmButtonText: 'OK'
          })
      }

      axios.post('/placeOrder', orderData)
          .then(response => {
            if (response.data.success) {
                Swal.fire({
                    title: 'Order Success!',
                    text: 'Your order has been placed successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                  const orderId = response.data.orderId;
                  window.location.href = `/orderSuccess?orderId=${orderId}`;
                })
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to place order. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
          })
          .catch(error => {
              console.error('Error placing order:', error);
              Swal.fire({
                  title: 'Error!',
                  text: 'An error Occured Check All Details Are Entered and Quantity of Product must be lessthan stock.',
                  icon: 'error',
                  confirmButtonText: 'OK'
              });
          });
    } else if (paymentMethod === 'Wallet'){
      const walletBalance = '<%=walletBalance.toFixed(2)%>';
      if (orderData.totalPrice>walletBalance) {
        Swal.fire({
          text: 'Insuffient Wallet Balance. Please try another method',
          icon: 'warning',
          confirmButtonText: 'OK'
        })
      }else{
        Swal.fire({
            title: 'Confirm Order',
            html: `<h5>Your wallet balance: <strong>₹${walletBalance}</strong></h5>
                    <h5>Total price: <strong>₹${orderData.totalPrice}</strong></h5>
                    <h5>Remaining balance after order: <strong>₹${(walletBalance - orderData.totalPrice).toFixed(2)}</strong></h5><br>
                    <h5>Do you want to proceed with the payment using your wallet?</h5>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, place order',
            cancelButtonText: 'No, cancel'
        }).then((result)=>{
          if (result.isConfirmed) {
            axios.post('/placeOrder',orderData)
              .then(response=>{
                if (response.data.success) {
                  Swal.fire({
                      title: 'Order Success!',
                      text: 'Your order has been placed successfully!',
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false,
                  }).then(() => {
                    const orderId = response.data.orderId;
                    window.location.href = `/orderSuccess?orderId=${orderId}`;
                  })
                }else{
                  Swal.fire({
                      title: 'Error!',
                      text: 'Failed to place order. Please try again.',
                      icon: 'error',
                      confirmButtonText: 'OK'
                  });
                }
              })
              .catch(error => {
                  console.error('Error placing order:', error);
                  Swal.fire({
                      title: 'Error!',
                      text: 'An error occurred while placing your order. Please try again.',
                      icon: 'error',
                      confirmButtonText: 'OK'
                  });
              });
          }
        })
      }
    }else if (paymentMethod === 'RazorPay') {
        console.log('Hello');
        const razorpayOrder = await axios.post('/create-razorpay-order', orderData);
        if (razorpayOrder.data.success) {
            console.log('Hello1');
            const options = {
                key: razorpayOrder.data.key_id,
                amount: razorpayOrder.data.order.amount,
                currency: "INR",
                name: "Rozeto",
                description: "Order Payment",
                order_id: razorpayOrder.data.order.id,
                handler: function (response) {
                    handlePaymentSuccess(response.razorpay_payment_id, razorpayOrder.data.order.id, orderData);
                },
                prefill: {
                    name: razorpayOrder.data.user,
                },
                theme: {
                    color: "#3399cc"
                }
            };
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Payment Failed. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
            rzp.open();
        }
    }
  }



  async function handlePaymentSuccess(paymentId, razorpayOrderId, orderData) {
    try {
        // Place the order first
        const orderResponse = await axios.post('/placeOrder', orderData);
        const orderId = orderResponse.data.orderId;

        // Confirm the payment
        const paymentResponse = await axios.post('/payment-success', {
            paymentId,
            razorpayOrderId,
            orderId
        });

        if (paymentResponse.data.success) {
            window.location.href = `/orderSuccess?orderId=${orderId}`;
        } else {
            Swal.fire('Payment Failed', paymentResponse.data.message, 'error');
        }
    } catch (error) {
        console.error('Error placing order or confirming payment:', error);
        Swal.fire({
            title: 'Error!',
            text: 'An error occurred while placing your order or confirming payment. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}