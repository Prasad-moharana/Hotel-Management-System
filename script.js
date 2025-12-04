// ======================================================
// HOTEL MANAGEMENT SYSTEM - FINAL SCRIPT.JS (FULL WORKING)
// ======================================================

// -------------------------- Utilities --------------------------
function showForm(formId) {
    document.getElementById("login-form")?.classList.remove("active");
    document.getElementById("register-form")?.classList.remove("active");
    document.getElementById(formId)?.classList.add("active");
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}

function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    alert("Logged out successfully.");
    window.location.href = "index.html";
}

// -------------------------- Auth Guard --------------------------
(function authGuard() {
    const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

    if (page === "index.html" || page === "") return;

    const logged = localStorage.getItem("isLoggedIn");
    if (!logged || logged !== "true") {
        window.location.href = "index.html";
    }
})();

// -------------------------- DOM Ready --------------------------
document.addEventListener("DOMContentLoaded", () => {

    // -------------------------- LOGIN --------------------------
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let email = this.email.value.trim();
            let password = this.password.value.trim();

            let savedUser = JSON.parse(localStorage.getItem("hotelUser"));

            if (!savedUser) {
                alert("No user registered! Please register first.");
                showForm("register-form");
                return false;
            }

            if (email === savedUser.email && password === savedUser.password) {
                alert("Login Successful!");
                localStorage.setItem("isLoggedIn", "true");
                window.location.href = "home.html";
                return true;
            }

            alert("Incorrect email or password!");
            return false;
        });
    }

    // -------------------------- REGISTER --------------------------
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let name = this.name.value.trim();
            let email = this.email.value.trim();
            let password = this.password.value.trim();
            let role = this.role.value;

            if (!name || !email || !password || !role) {
                alert("Please fill all fields.");
                return;
            }

            let userData = { name, email, password, role };
            localStorage.setItem("hotelUser", JSON.stringify(userData));

            alert("Registration successful! Now you can login.");
            showForm("login-form");
        });
    }

    initBookingPage();
    initManagementPage();
});

// -------------------------- Booking Page --------------------------
function initBookingPage() {
    const bookingForm = document.getElementById("bookingForm");
    if (!bookingForm) return;

    bookingForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const roomType = document.getElementById("roomType").value;
        const checkIn = document.getElementById("checkIn").value;
        const checkOut = document.getElementById("checkOut").value;

        if (!name || !email || !phone || !roomType || !checkIn || !checkOut) {
            alert("Please fill all fields.");
            return;
        }

        if (new Date(checkOut) < new Date(checkIn)) {
            alert("Check-out date must be same or after check-in date.");
            return;
        }

        const selectedFoods = [...document.querySelectorAll('input[name="food"]:checked')]
            .map(f => f.value);

        const foodPrices = { breakfast:150, lunch:300, dinner:250 };
        const totalFoodCost = selectedFoods.reduce((s, f) => s + foodPrices[f], 0);

        const booking = {
            name, email, phone, roomType,
            checkIn, checkOut,
            selectedFoods, totalFoodCost,
            status: "Pending",
            createdAt: new Date().toISOString()
        };

        let all = JSON.parse(localStorage.getItem("allBookings") || "[]");
        const editIndex = localStorage.getItem("hms_edit_index");

        if (editIndex !== null) {
            all[Number(editIndex)] = booking;
            localStorage.setItem("allBookings", JSON.stringify(all));
            localStorage.removeItem("hms_edit_index");
            localStorage.removeItem("hms_edit_booking");
            window.location.href = "management.html";
            return;
        }

        all.push(booking);
        localStorage.setItem("allBookings", JSON.stringify(all));
        window.location.href = "management.html";
    });
}

// Prefill for edit mode
(function () {
    if (window.location.pathname.split("/").pop().toLowerCase() !== "booking.html") return;

    const bookingStr = localStorage.getItem("hms_edit_booking");
    if (!bookingStr) return;

    document.addEventListener("DOMContentLoaded", () => {
        const booking = JSON.parse(bookingStr);

        document.getElementById("name").value = booking.name;
        document.getElementById("email").value = booking.email;
        document.getElementById("phone").value = booking.phone;
        document.getElementById("roomType").value = booking.roomType;
        document.getElementById("checkIn").value = booking.checkIn;
        document.getElementById("checkOut").value = booking.checkOut;

        booking.selectedFoods.forEach(food => {
            const cb = document.querySelector(`input[name="food"][value="${food}"]`);
            if (cb) cb.checked = true;
        });
    });
})();

// -------------------------- Management Page --------------------------
function initManagementPage() {
    const tbody = document.getElementById("bookingData");
    if (!tbody) return;

    const all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    tbody.innerHTML = "";

    if (all.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No bookings found</td></tr>`;
        document.getElementById("billSection").style.display = "none";
        return;
    }

    all.forEach((b, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i+1}</td>
            <td>${escapeHtml(b.name)}</td>
            <td>${escapeHtml(b.roomType)}</td>
            <td>${escapeHtml(b.checkIn)}</td>
            <td>${escapeHtml(b.checkOut)}</td>
            <td>${b.selectedFoods.length ? b.selectedFoods.join(", ") : "None"}</td>
            <td id="status-${i}">${b.status}</td>
            <td>
                <button onclick="checkIn(${i})">Check-In</button>
                <button onclick="doCheckOut(${i})">Check-Out</button>
                <button onclick="editBooking(${i})">Edit</button>
                <button onclick="generateBill(${i})">Bill</button>
                <button onclick="clearBooking(${i})" style="background:#c0392b;color:#fff">Clear</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStatus(index, status) {
    let all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    all[index].status = status;
    localStorage.setItem("allBookings", JSON.stringify(all));
    document.getElementById(`status-${index}`).innerText = status;
}

function checkIn(i) { updateStatus(i, "Checked-In"); }

function doCheckOut(i) {
    updateStatus(i, "Checked-Out");
    generateBill(i, { showAfterCheckout:true });
}

function editBooking(i) {
    const all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    localStorage.setItem("hms_edit_index", i);
    localStorage.setItem("hms_edit_booking", JSON.stringify(all[i]));
    window.location.href = "booking.html";
}

function generateBill(index, opts = {}) {
    const all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    const b = all[index];
    if (!b) return alert("Booking not found");

    const roomPrices = { Single:2000, Double:3000, Deluxe:5000 };
    const foodPrices = { breakfast:150, lunch:300, dinner:250 };

    let days = 1;
    const ci = new Date(b.checkIn);
    const co = new Date(b.checkOut);
    if (co > ci) days = Math.ceil((co - ci) / 86400000);

    const roomCost = roomPrices[b.roomType] * days;
    const foodCost = b.selectedFoods.reduce((s,f) => s + foodPrices[f], 0);
    const total = roomCost + foodCost;

    const billSection = document.getElementById("billSection");
    const billDetails = document.getElementById("billDetails");

    billDetails.innerHTML = `
        <p><strong>Guest:</strong> ${b.name}</p>
        <p><strong>Room:</strong> ${b.roomType} (${days} nights)</p>
        <p><strong>Room Charges:</strong> ₹${roomCost}</p>
        <p><strong>Food Charges:</strong> ₹${foodCost}</p>
        <h3>Total Bill: ₹${total}</h3>
        <p>Status: ${b.status}</p>
        <hr>

        <!-- PAYMENT SECTION ADDED -->
        <div class="payment-section">
            <h2>Select Payment Method</h2>

            <select id="paymentMethod">
                <option value="">-- Select Payment --</option>
                <option value="netbanking">Net Banking</option>
                <option value="phonepe">Phone Pe</option>
                <option value="gpay">Google Pay</option>
                <option value="paytm">Paytm</option>
                
            </select>

            <div id="qrBox" style="display:none;">
                <h3>Scan & Pay</h3>
                <img src="qr.png" class="qr-image">
            </div>

            <button class="btn-pay" onclick="processPayment(${index})">Pay Now</button>

            <p id="paymentSuccess" class="success-msg" style="display:none;">
                ✔ Payment Successful!
            </p>
        </div>
    `;

    billSection.style.display = "block";

    if (opts.showAfterCheckout) {
        setTimeout(() => billSection.scrollIntoView({ behavior:"smooth" }), 200);
    }

}

// -------------------------- NEW PAYMENT FUNCTION --------------------------
function processPayment(index) {
    const method = document.getElementById("paymentMethod").value;

    if (!method) {
        alert("Please select a payment method!");
        return;
    }

    let all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    all[index].status = "Paid";
    localStorage.setItem("allBookings", JSON.stringify(all));

    document.getElementById("paymentSuccess").style.display = "block";
    document.getElementById(`status-${index}`).innerText = "Paid";

    alert("Payment completed successfully!");
}



// -------------------------- CLEAR FUNCTIONS --------------------------
function clearBooking(index) {
    if (!confirm("Remove this booking?")) return;

    let all = JSON.parse(localStorage.getItem("allBookings") || "[]");
    all.splice(index,1);
    localStorage.setItem("allBookings", JSON.stringify(all));

    initManagementPage();
    document.getElementById("billSection").style.display = "none";
}

function clearAllHistory() {
    if (!confirm("Clear all bookings?")) return;

    localStorage.removeItem("allBookings");
    initManagementPage();

    document.getElementById("billSection").style.display = "none";
}

