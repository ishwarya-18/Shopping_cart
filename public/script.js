document.addEventListener("DOMContentLoaded", function () {
    const steps = document.querySelectorAll(".step-btn");
    const stepContents = document.querySelectorAll(".step-content");
    const sessionId = "session_" + Math.random().toString(36).substr(2, 9); // Generate session ID

    steps.forEach(step => {
        step.addEventListener("click", function () {
            steps.forEach(s => s.classList.remove("active"));
            this.classList.add("active");

            const stepId = this.dataset.step;
            stepContents.forEach(content => content.classList.add("hidden"));
            document.getElementById(stepId).classList.remove("hidden");
        });
    });
    document.querySelectorAll("#cart-items tr").forEach(row => {
        row.querySelector(".quantity-input").value = 0;
        row.querySelector(".total-price").textContent = "$0.00";
    });
    document.getElementById("grand-total").textContent = "0.00";
    
    document.querySelectorAll(".quantity-input").forEach(input => {
        input.value = 0; // Set default quantity to 0
        input.addEventListener("input", function () {
            const price = parseFloat(this.dataset.price);
            const quantity = parseInt(this.value) || 0;
            this.closest("tr").querySelector(".total-price").textContent = "$" + (price * quantity).toFixed(2);
            updateCartTotal();
        });
    });

    function updateCartTotal() {
        let cartTotal = 0;
        document.querySelectorAll(".total-price").forEach(priceElement => {
            cartTotal += parseFloat(priceElement.textContent.replace("$", ""));
        });
        document.getElementById("grand-total").textContent = cartTotal.toFixed(2);
    }

    document.getElementById("next-to-shipping").addEventListener("click", function () {
        if (document.querySelectorAll("#cart-items tr").length === 0) {
            alert("Your cart is empty!");
            return;
        }
        document.querySelector("[data-step='shipping']").click();
    });

    document.getElementById("next-to-payment").addEventListener("click", function () {
        const name = document.getElementById("name").value.trim();
        const address = document.getElementById("address").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const zip = document.getElementById("zip").value.trim(); // ✅ Add zip validation
        const email = document.getElementById("email").value.trim(); // ✅ Add email validation
        
        if (!name || !address || !phone || !zip || !email) {
            alert("Please fill in all shipping details including ZIP code and Email.");
            return;
        }
        document.querySelector("[data-step='payment']").click();
    });    

    document.getElementById("checkout-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const paymentMethod = document.getElementById("payment-method").value;
        const sessionId = "random-session-id"; // Replace with actual session logic
        const totalAmount = parseFloat(document.getElementById("grand-total").textContent);
        
        const items = [];
        document.querySelectorAll("#cart-items tr").forEach(row => {
            const itemName = row.cells[0].textContent;
            const price = parseFloat(row.cells[1].textContent.replace("$", ""));
            const quantity = parseInt(row.querySelector(".quantity-input").value);
            items.push({ itemName, price, quantity });
        });
    
        const shippingDetails = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim(),
            zip: document.getElementById("zip").value.trim(),
        };
    
        // ✅ Validate fields & show specific errors
        let errors = {};
    
        if (!shippingDetails.name.match(/^[A-Za-z\s]+$/)) {
            errors.name = "Name should contain only alphabets.";
        }
        if (!shippingDetails.email.match(/^\S+@\S+\.\S+$/)) {
            errors.email = "Enter a valid email.";
        }
        if (!shippingDetails.phone.match(/^\d{10}$/)) {
            errors.phone = "Phone number should be 10 digits.";
        }
        if (!shippingDetails.zip.match(/^\d+$/)) {
            errors.zip = "ZIP Code should contain only numbers.";
        }
        if (!shippingDetails.address) {
            errors.address = "Address is required.";
        }
    
        // ✅ Show error messages
        if (Object.keys(errors).length > 0) {
            let errorMsg = Object.values(errors).join("\n");
            alert(errorMsg);
            return;
        }
    
        const orderData = { sessionId, paymentMethod, totalAmount, items, shippingDetails };
    
        try {
            const response = await fetch("/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert("Order placed successfully!");
    
                // ✅ Reset all fields
                document.getElementById("shipping-form").reset();
                document.getElementById("checkout-form").reset();
                
                // ✅ Reset cart with initial quantities set to 0 instead of clearing
                document.querySelectorAll("#cart-items tr").forEach(row => {
                    row.querySelector(".quantity-input").value = 0;
                    row.querySelector(".total-price").textContent = "$0.00";
                });
                document.getElementById("grand-total").textContent = "0.00";
    
                // ✅ Move back to Cart step
                document.querySelector("[data-step='cart']").click();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("❌ Order Error:", error);
            alert("Failed to place order. Try again!");
        }
    });       

    document.getElementById("payment-method").addEventListener("change", function () {
        const paymentDetails = document.getElementById("payment-details");
        paymentDetails.innerHTML = "";

        if (this.value === "card") {
            paymentDetails.innerHTML = `
                <input type="text" id="card-number" placeholder="Card Number" maxlength="16">
                <input type="text" id="expiry" placeholder="MM/YY" maxlength="5">
                <input type="text" id="cvv" placeholder="CVV" maxlength="3">
            `;
        } else if (this.value === "upi") {
            paymentDetails.innerHTML = `<input type="text" id="upi-id" placeholder="Enter UPI ID">`;
        } else if (this.value === "netbanking") {
            paymentDetails.innerHTML = `<input type="text" id="bank-name" placeholder="Enter Bank Name">`;
        }
    });
});
