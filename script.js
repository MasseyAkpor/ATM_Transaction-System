// Stack implementation
class TransactionStack {
    constructor() {
        this.items = [];
        this.transactionId = 1;
    }
    
    // Push transaction onto stack
    push(transaction) {
        transaction.id = this.transactionId++;
        transaction.timestamp = new Date().toLocaleString();
        this.items.push(transaction);
        this.logToSystem(`Transaction #${transaction.id} (${transaction.type}) pushed onto stack.`, "success");
        return transaction;
    }
    
    // Remove and return the top transaction
    pop() {
        if (this.isEmpty()) {
            this.logToSystem("Stack is empty. No transaction to undo.", "error");
            return null;
        }
        const transaction = this.items.pop();
        this.logToSystem(`Transaction #${transaction.id} (${transaction.type}) popped from stack.`, "info");
        return transaction;
    }
    
    // View the top transaction without removing it
    peek() {
        if (this.isEmpty()) {
            this.logToSystem("Stack is empty. No transaction to view.", "error");
            return null;
        }
        return this.items[this.items.length - 1];
    }
    
    // Check if stack is empty
    isEmpty() {
        return this.items.length === 0;
    }
    
    // Get all items in the stack
    getAll() {
        return [...this.items].reverse(); // Return in LIFO order for display
    }
    
    // Get stack size
    size() {
        return this.items.length;
    }
    
    // Log to system
    logToSystem(message, type = "info") {
        const logEntry = document.createElement("div");
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        document.getElementById("systemLog").appendChild(logEntry);
        document.getElementById("systemLog").scrollTop = document.getElementById("systemLog").scrollHeight;
    }
}

// ATM System
class ATM {
    constructor() {
        this.balance = 5000.00;
        this.stack = new TransactionStack();
        this.currentForm = null;
        this.initializeEventListeners();
        this.updateDisplay();
        this.loadSampleTransactions();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Transaction buttons
        document.querySelectorAll('.transaction-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.transaction-btn').dataset.action;
                this.showTransactionForm(action);
            });
        });
        
        // Stack operation buttons
        document.getElementById('peekBtn').addEventListener('click', () => this.peekTransaction());
        document.getElementById('popBtn').addEventListener('click', () => this.undoTransaction());
        document.getElementById('viewAllBtn').addEventListener('click', () => this.viewAllTransactions());
    }
    
    // Show transaction form based on action
    showTransactionForm(action) {
        const formsContainer = document.getElementById('transactionForms');
        
        // Remove existing form
        if (this.currentForm) {
            formsContainer.removeChild(this.currentForm);
        }
        
        // Create new form based on action
        let formHTML = '';
        
        switch(action) {
            case 'withdraw':
                formHTML = this.createWithdrawForm();
                break;
                
            case 'deposit':
                formHTML = this.createDepositForm();
                break;
                
            case 'transfer':
                formHTML = this.createTransferForm();
                break;
                
            case 'balance':
                this.performBalanceInquiry();
                return;
        }
        
        formsContainer.innerHTML = formHTML;
        this.currentForm = document.querySelector('.transaction-form');
        this.currentForm.style.display = 'block';
        
        // Add event listeners to form buttons
        this.attachFormEventListeners(action);
    }
    
    // Create withdraw form
    createWithdrawForm() {
        return `
            <div class="transaction-form" id="withdrawForm">
                <h3 class="form-title">Withdraw Funds</h3>
                <input type="number" id="withdrawAmount" placeholder="Enter amount to withdraw" min="1" step="0.01">
                <div class="form-buttons">
                    <button class="submit-btn" id="submitWithdraw">Withdraw</button>
                    <button class="cancel-btn" id="cancelWithdraw">Cancel</button>
                </div>
            </div>
        `;
    }
    
    // Create deposit form
    createDepositForm() {
        return `
            <div class="transaction-form" id="depositForm">
                <h3 class="form-title">Deposit Funds</h3>
                <input type="number" id="depositAmount" placeholder="Enter amount to deposit" min="1" step="0.01">
                <div class="form-buttons">
                    <button class="submit-btn" id="submitDeposit">Deposit</button>
                    <button class="cancel-btn" id="cancelDeposit">Cancel</button>
                </div>
            </div>
        `;
    }
    
    // Create transfer form
    createTransferForm() {
        return `
            <div class="transaction-form" id="transferForm">
                <h3 class="form-title">Transfer Funds</h3>
                <input type="number" id="transferAmount" placeholder="Enter amount to transfer" min="1" step="0.01">
                <input type="text" id="transferAccount" placeholder="Recipient account number">
                <div class="form-buttons">
                    <button class="submit-btn" id="submitTransfer">Transfer</button>
                    <button class="cancel-btn" id="cancelTransfer">Cancel</button>
                </div>
            </div>
        `;
    }
    
    // Attach event listeners to form buttons
    attachFormEventListeners(action) {
        switch(action) {
            case 'withdraw':
                document.getElementById('submitWithdraw').addEventListener('click', () => this.performWithdrawal());
                document.getElementById('cancelWithdraw').addEventListener('click', () => this.cancelTransaction());
                break;
            case 'deposit':
                document.getElementById('submitDeposit').addEventListener('click', () => this.performDeposit());
                document.getElementById('cancelDeposit').addEventListener('click', () => this.cancelTransaction());
                break;
            case 'transfer':
                document.getElementById('submitTransfer').addEventListener('click', () => this.performTransfer());
                document.getElementById('cancelTransfer').addEventListener('click', () => this.cancelTransaction());
                break;
        }
    }
    
    // Cancel transaction form
    cancelTransaction() {
        if (this.currentForm) {
            this.currentForm.style.display = 'none';
            this.stack.logToSystem("Transaction cancelled.", "info");
        }
    }
    
    // Perform withdrawal
    performWithdrawal() {
        const amountInput = document.getElementById('withdrawAmount');
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
            this.stack.logToSystem("Invalid withdrawal amount.", "error");
            alert("Please enter a valid amount to withdraw.");
            return;
        }
        
        if (amount > this.balance) {
            this.stack.logToSystem(`Withdrawal failed: Insufficient funds.`, "error");
            alert("Insufficient funds for this withdrawal.");
            return;
        }
        
        // Update balance
        this.balance -= amount;
        
        // Create transaction record
        const transaction = {
            type: 'Withdrawal',
            amount: amount,
            previousBalance: this.balance + amount,
            newBalance: this.balance,
            description: `Cash withdrawal of $${amount.toFixed(2)}`
        };
        
        // Push to stack
        this.stack.push(transaction);
        
        // Update display
        this.updateDisplay();
        
        // Hide form
        this.currentForm.style.display = 'none';
        
        // Log success
        this.stack.logToSystem(`Successfully withdrew $${amount.toFixed(2)}. New balance: $${this.balance.toFixed(2)}`, "success");
    }
    
    // Perform deposit
    performDeposit() {
        const amountInput = document.getElementById('depositAmount');
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
            this.stack.logToSystem("Invalid deposit amount.", "error");
            alert("Please enter a valid amount to deposit.");
            return;
        }
        
        // Update balance
        this.balance += amount;
        
        // Create transaction record
        const transaction = {
            type: 'Deposit',
            amount: amount,
            previousBalance: this.balance - amount,
            newBalance: this.balance,
            description: `Cash deposit of $${amount.toFixed(2)}`
        };
        
        // Push to stack
        this.stack.push(transaction);
        
        // Update display
        this.updateDisplay();
        
        // Hide form
        this.currentForm.style.display = 'none';
        
        // Log success
        this.stack.logToSystem(`Successfully deposited $${amount.toFixed(2)}. New balance: $${this.balance.toFixed(2)}`, "success");
    }
    
    // Perform transfer
    performTransfer() {
        const amountInput = document.getElementById('transferAmount');
        const accountInput = document.getElementById('transferAccount');
        const amount = parseFloat(amountInput.value);
        const account = accountInput.value.trim();
        
        if (!amount || amount <= 0) {
            this.stack.logToSystem("Invalid transfer amount.", "error");
            alert("Please enter a valid amount to transfer.");
            return;
        }
        
        if (!account) {
            this.stack.logToSystem("Invalid recipient account.", "error");
            alert("Please enter a valid recipient account number.");
            return;
        }
        
        if (amount > this.balance) {
            this.stack.logToSystem(`Transfer failed: Insufficient funds.`, "error");
            alert("Insufficient funds for this transfer.");
            return;
        }
        
        // Update balance
        this.balance -= amount;
        
        // Create transaction record
        const transaction = {
            type: 'Transfer',
            amount: amount,
            previousBalance: this.balance + amount,
            newBalance: this.balance,
            description: `Transfer of $${amount.toFixed(2)} to account ${account}`
        };
        
        // Push to stack
        this.stack.push(transaction);
        
        // Update display
        this.updateDisplay();
        
        // Hide form
        this.currentForm.style.display = 'none';
        
        // Log success
        this.stack.logToSystem(`Successfully transferred $${amount.toFixed(2)} to account ${account}. New balance: $${this.balance.toFixed(2)}`, "success");
    }
    
    // Perform balance inquiry
    performBalanceInquiry() {
        // Create transaction record
        const transaction = {
            type: 'Balance Inquiry',
            amount: 0,
            previousBalance: this.balance,
            newBalance: this.balance,
            description: `Balance inquiry - Current balance: $${this.balance.toFixed(2)}`
        };
        
        // Push to stack
        this.stack.push(transaction);
        
        // Update display
        this.updateDisplay();
        
        // Log success
        this.stack.logToSystem(`Balance inquiry performed. Current balance: $${this.balance.toFixed(2)}`, "success");
    }
    
    // Peek at the most recent transaction
    peekTransaction() {
        const transaction = this.stack.peek();
        if (transaction) {
            this.stack.logToSystem(`Peek at stack: ${transaction.type} of $${transaction.amount.toFixed(2)} on ${transaction.timestamp}`, "info");
            
            // Highlight the top transaction temporarily
            this.highlightTopTransaction();
        }
    }
    
    // Undo the most recent transaction
    undoTransaction() {
        const transaction = this.stack.pop();
        if (transaction) {
            // Reverse the transaction
            if (transaction.type === 'Withdrawal') {
                this.balance += transaction.amount;
                this.stack.logToSystem(`Undid withdrawal: Added back $${transaction.amount.toFixed(2)}`, "info");
            } else if (transaction.type === 'Deposit') {
                this.balance -= transaction.amount;
                this.stack.logToSystem(`Undid deposit: Subtracted $${transaction.amount.toFixed(2)}`, "info");
            } else if (transaction.type === 'Transfer') {
                this.balance += transaction.amount;
                this.stack.logToSystem(`Undid transfer: Added back $${transaction.amount.toFixed(2)}`, "info");
            } else if (transaction.type === 'Balance Inquiry') {
                this.stack.logToSystem(`Undid balance inquiry (no balance change)`, "info");
            }
            
            // Update display
            this.updateDisplay();
            this.stack.logToSystem(`Transaction undone. New balance: $${this.balance.toFixed(2)}`, "success");
        }
    }
    
    // View all transactions
    viewAllTransactions() {
        const transactions = this.stack.getAll();
        if (transactions.length === 0) {
            this.stack.logToSystem("No transactions to display. Stack is empty.", "info");
            return;
        }
        
        this.stack.logToSystem(`Viewing all ${transactions.length} transactions (LIFO order):`, "info");
        transactions.forEach((t, index) => {
            this.stack.logToSystem(`${index+1}. ${t.type}: $${t.amount.toFixed(2)} on ${t.timestamp}`, "info");
        });
    }
    
    // Update balance and stack visualization
    updateDisplay() {
        // Update balance display
        document.getElementById('currentBalance').textContent = `$${this.balance.toFixed(2)}`;
        
        // Update stack visualization
        const stackContainer = document.getElementById('stackContainer');
        stackContainer.innerHTML = '';
        
        const transactions = this.stack.getAll();
        
        if (transactions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'stack-item';
            emptyMessage.innerHTML = `<i>Stack is empty. Perform a transaction to see it here.</i>`;
            stackContainer.appendChild(emptyMessage);
            return;
        }
        
        // Display transactions in LIFO order (most recent at top)
        transactions.forEach((transaction, index) => {
            const stackItem = document.createElement('div');
            stackItem.className = `stack-item ${index === 0 ? 'recent' : ''}`;
            
            const typeClass = transaction.type.toLowerCase().replace(' ', '');
            const amountClass = 
                transaction.type === 'Withdrawal' || transaction.type === 'Transfer' ? 'withdrawal' : 
                transaction.type === 'Deposit' ? 'deposit' : 'balanceinquiry';
            
            stackItem.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-type ${typeClass}">${transaction.type}</div>
                    <div>${transaction.timestamp}</div>
                    <div>${transaction.description}</div>
                </div>
                <div class="transaction-details">
                    <div class="amount ${amountClass}">$${transaction.amount.toFixed(2)}</div>
                    <div>ID: ${transaction.id}</div>
                </div>
            `;
            
            stackContainer.appendChild(stackItem);
        });
    }
    
    // Highlight the top transaction temporarily
    highlightTopTransaction() {
        const stackItems = document.querySelectorAll('.stack-item');
        if (stackItems.length > 0) {
            const topItem = stackItems[0];
            const originalClass = topItem.className;
            
            // Add highlight animation
            topItem.className = originalClass + ' recent';
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
                topItem.className = originalClass;
            }, 2000);
        }
    }
    
    // Load sample transactions for demonstration
    loadSampleTransactions() {
        setTimeout(() => {
            const sampleTransactions = [
                { type: 'Deposit', amount: 1000, description: 'Initial deposit of $1000.00' },
                { type: 'Withdrawal', amount: 200, description: 'Cash withdrawal of $200.00' },
                { type: 'Transfer', amount: 500, description: 'Transfer of $500.00 to account XXXX-5678' },
                { type: 'Balance Inquiry', amount: 0, description: 'Balance inquiry' }
            ];
            
            sampleTransactions.forEach(t => {
                const transaction = {
                    type: t.type,
                    amount: t.amount,
                    previousBalance: this.balance - (t.type === 'Deposit' ? t.amount : (t.type === 'Withdrawal' || t.type === 'Transfer' ? -t.amount : 0)),
                    newBalance: this.balance,
                    description: t.description
                };
                
                if (t.type === 'Deposit') this.balance += t.amount;
                if (t.type === 'Withdrawal' || t.type === 'Transfer') this.balance -= t.amount;
                
                transaction.newBalance = this.balance;
                this.stack.push(transaction);
            });
            
            this.updateDisplay();
            this.stack.logToSystem("Sample transactions loaded for demonstration.", "info");
        }, 1000);
    }
}

// Initialize the ATM system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.atm = new ATM();
});