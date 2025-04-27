// src/BudgetPage.js - V2 (Removed Unused Imports)
import React, { useState, useMemo } from 'react';
// Removed unused Link import
// Removed unused icons: DollarSign, TrendingUp, TrendingDown, Info
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import './WeddingPlannerApp.css';

// Default categories - can be expanded
const defaultCategories = [
    'Venue', 'Catering', 'Photography/Videography', 'Attire', 'Florals & Decor',
    'Music/Entertainment', 'Stationery', 'Cake', 'Rings', 'Officiant',
    'Hair & Makeup', 'Transportation', 'Favors & Gifts', 'Miscellaneous'
];

function BudgetPage({
    // Props from App.js
    allottedBudget, setAllottedBudget,
    expenses, setExpenses
}) {

    // --- State for the Add Expense Form ---
    const [newItem, setNewItem] = useState('');
    const [newCategory, setNewCategory] = useState(defaultCategories[0]);
    const [newEstimatedCost, setNewEstimatedCost] = useState('');
    const [newActualCost, setNewActualCost] = useState('');
    const [editingBudgetAllotted, setEditingBudgetAllotted] = useState(false);
    const [tempAllottedBudget, setTempAllottedBudget] = useState(allottedBudget);

    // Add these new state variables at the top of the BudgetPage component, after the existing useState declarations
    const [editingExpense, setEditingExpense] = useState(null);
    const [editedItem, setEditedItem] = useState('');
    const [editedCategory, setEditedCategory] = useState('');
    const [editedEstimatedCost, setEditedEstimatedCost] = useState('');
    const [editedActualCost, setEditedActualCost] = useState('');

    // --- Calculations ---
    const summary = useMemo(() => {
        const totalEstimated = expenses.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
        const totalSpentOrCommitted = expenses.reduce((sum, item) => {
            const cost = Number(item.actualCost) || Number(item.estimatedCost) || 0;
            return sum + cost;
        }, 0);
        const remaining = allottedBudget - totalSpentOrCommitted;
        return {
            totalEstimated,
            totalSpentOrCommitted,
            remaining
        };
    }, [expenses, allottedBudget]);

    // --- Event Handlers ---
    const handleSetBudgetAllotted = () => {
        const newBudget = Number(tempAllottedBudget);
        if (!isNaN(newBudget) && newBudget >= 0) {
            setAllottedBudget(newBudget);
            setEditingBudgetAllotted(false);
        } else {
            alert("Please enter a valid non-negative number for the budget.");
        }
    };

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newItem || !newCategory || !newEstimatedCost) {
            alert("Please fill in at least Item/Vendor, Category, and Estimated Cost.");
            return;
        }
        const newExpense = {
            id: Date.now(),
            item: newItem,
            category: newCategory,
            estimatedCost: Number(newEstimatedCost) || 0,
            actualCost: newActualCost ? Number(newActualCost) : null
        };
        setExpenses(prevExpenses => [...prevExpenses, newExpense]);
        // Clear form
        setNewItem('');
        setNewCategory(defaultCategories[0]);
        setNewEstimatedCost('');
        setNewActualCost('');
    };

    const handleDeleteExpense = (id) => {
        if (window.confirm("Are you sure you want to delete this expense item?")) {
            setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense.id);
        setEditedItem(expense.item);
        setEditedCategory(expense.category);
        setEditedEstimatedCost(expense.estimatedCost.toString());
        setEditedActualCost(expense.actualCost ? expense.actualCost.toString() : '');
    };

    const handleSaveEdit = (id) => {
        if (!editedItem || !editedCategory || !editedEstimatedCost) {
            alert("Please fill in all required fields");
            return;
        }

        setExpenses(prevExpenses => prevExpenses.map(expense => {
            if (expense.id === id) {
                return {
                    ...expense,
                    item: editedItem,
                    category: editedCategory,
                    estimatedCost: Number(editedEstimatedCost),
                    actualCost: editedActualCost ? Number(editedActualCost) : null
                };
            }
            return expense;
        }));

        // Reset editing state
        setEditingExpense(null);
        setEditedItem('');
        setEditedCategory('');
        setEditedEstimatedCost('');
        setEditedActualCost('');
    };

    const handleCancelEdit = () => {
        setEditingExpense(null);
        setEditedItem('');
        setEditedCategory('');
        setEditedEstimatedCost('');
        setEditedActualCost('');
    };

    // --- Format Currency ---
    const formatCurrency = (amount) => {
        if (amount === null || isNaN(amount)) return '-';
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="page-container budget-page-container">
            <div className="app-header">
                 <h1 className="app-title">Budget Tracker</h1>
                 <h2 className="app-subtitle">Manage your wedding expenses</h2>
            </div>

            {/* Budget Summary Section */}
            <section className="budget-summary-section status-card-item">
                 { /* ... unchanged JSX for summary section ... */ }
                  <h3 className="budget-section-title">Overall Budget</h3>
                 <div className="budget-allotted-area">
                     <label htmlFor="allottedBudgetInput">Total Allotted Budget:</label>
                     {editingBudgetAllotted ? (
                         <div className="budget-input-group">
                             <input
                                 type="number"
                                 id="allottedBudgetInput"
                                 className="budget-input-large"
                                 value={tempAllottedBudget}
                                 onChange={(e) => setTempAllottedBudget(e.target.value)}
                                 onBlur={handleSetBudgetAllotted} // Optionally save on blur
                                 onKeyDown={(e) => e.key === 'Enter' && handleSetBudgetAllotted()}
                                 min="0"
                                 step="100"
                             />
                             <button onClick={handleSetBudgetAllotted} className="action-button primary-button budget-set-button">Set</button>
                             <button onClick={() => { setEditingBudgetAllotted(false); setTempAllottedBudget(allottedBudget); }} className="action-button secondary-button budget-cancel-button">Cancel</button>
                         </div>
                     ) : (
                         <div className="budget-display-group">
                             <span className="budget-allotted-display">{formatCurrency(allottedBudget)}</span>
                             <button onClick={() => setEditingBudgetAllotted(true)} className="edit-budget-button" title="Edit Allotted Budget">
                                 <Edit2 size={16}/>
                             </button>
                         </div>
                     )}
                 </div>
                 <div className="budget-summary-figures">
                     <div className="figure-item spent">
                         <span className="figure-label">Spent / Committed</span>
                         <span className="figure-value">{formatCurrency(summary.totalSpentOrCommitted)}</span>
                     </div>
                     <div className={`figure-item remaining ${summary.remaining < 0 ? 'negative' : 'positive'}`}>
                         <span className="figure-label">Remaining</span>
                         <span className="figure-value">{formatCurrency(summary.remaining)}</span>
                     </div>
                 </div>
                 {/* Optional Progress Bar */}
                 <div className="budget-progress-container">
                     <div
                         className={`budget-progress-bar ${summary.remaining < 0 ? 'over-budget' : ''}`}
                         style={{ width: `${allottedBudget > 0 ? Math.min(100, (summary.totalSpentOrCommitted / allottedBudget) * 100) : 0}%` }}
                     ></div>
                 </div>
                 {summary.remaining < 0 && <p className="over-budget-warning">You are {formatCurrency(Math.abs(summary.remaining))} over budget!</p>}
            </section>

             {/* Add Expense Section */}
             <section className="add-expense-section">
                 { /* ... unchanged JSX for add expense form ... */ }
                   <h3 className="budget-section-title">Add New Expense</h3>
                  <form className="add-expense-form" onSubmit={handleAddExpense}>
                       <div className="form-row">
                           <div className="form-group category">
                               <label htmlFor="newCategory">Category</label>
                               <select
                                   id="newCategory"
                                   value={newCategory}
                                   onChange={(e) => setNewCategory(e.target.value)}
                                   required
                               >
                                   {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                               </select>
                           </div>
                           <div className="form-group item">
                               <label htmlFor="newItem">Item / Vendor</label>
                               <input
                                   type="text"
                                   id="newItem"
                                   value={newItem}
                                   onChange={(e) => setNewItem(e.target.value)}
                                   placeholder="e.g., Venue Deposit, DJ Services"
                                   required
                               />
                           </div>
                           <div className="form-group cost estimated">
                               <label htmlFor="newEstimatedCost">Estimated Cost</label>
                               <input
                                   type="number"
                                   id="newEstimatedCost"
                                   value={newEstimatedCost}
                                   onChange={(e) => setNewEstimatedCost(e.target.value)}
                                   placeholder="1000.00"
                                   min="0"
                                   step="0.01"
                                   required
                               />
                           </div>
                           <div className="form-group cost actual">
                                <label htmlFor="newActualCost">Actual Cost (Optional)</label>
                                <input
                                    type="number"
                                    id="newActualCost"
                                    value={newActualCost}
                                    onChange={(e) => setNewActualCost(e.target.value)}
                                    placeholder="950.00"
                                    min="0"
                                    step="0.01"
                                />
                           </div>
                           <div className="form-group action">
                                <button type="submit" className="action-button primary-button add-expense-button">
                                    <PlusCircle size={16} /> Add
                                </button>
                           </div>
                       </div>
                  </form>
             </section>

             {/* Expense Items Table */}
             <section className="expense-items-section">
                 <h3 className="budget-section-title">Expense Items</h3>
                 <div className="expense-table">
                     <div className="expense-header">
                         <div className="cell">CATEGORY</div>
                         <div className="cell">ITEM / VENDOR</div>
                         <div className="cell">ESTIMATED COST</div>
                         <div className="cell">ACTUAL COST</div>
                         <div className="cell">ACTIONS</div>
                     </div>
                     {expenses.map(expense => (
                         <div key={expense.id} className="expense-row">
                             {editingExpense === expense.id ? (
                                 // Editing mode
                                 <>
                                     <div className="cell">
                                         <select
                                             value={editedCategory}
                                             onChange={(e) => setEditedCategory(e.target.value)}
                                             className="edit-input"
                                         >
                                             {defaultCategories.map(cat => (
                                                 <option key={cat} value={cat}>{cat}</option>
                                             ))}
                                         </select>
                                     </div>
                                     <div className="cell">
                                         <input
                                             type="text"
                                             value={editedItem}
                                             onChange={(e) => setEditedItem(e.target.value)}
                                             className="edit-input"
                                             placeholder="Item/Vendor"
                                         />
                                     </div>
                                     <div className="cell">
                                         <input
                                             type="number"
                                             value={editedEstimatedCost}
                                             onChange={(e) => setEditedEstimatedCost(e.target.value)}
                                             className="edit-input"
                                             min="0"
                                             step="0.01"
                                         />
                                     </div>
                                     <div className="cell">
                                         <input
                                             type="number"
                                             value={editedActualCost}
                                             onChange={(e) => setEditedActualCost(e.target.value)}
                                             className="edit-input"
                                             min="0"
                                             step="0.01"
                                             placeholder="Optional"
                                         />
                                     </div>
                                     <div className="cell actions">
                                         <button 
                                             onClick={() => handleSaveEdit(expense.id)}
                                             className="action-button primary-button"
                                         >
                                             Save
                                         </button>
                                         <button 
                                             onClick={handleCancelEdit}
                                             className="action-button secondary-button"
                                         >
                                             Cancel
                                         </button>
                                     </div>
                                 </>
                             ) : (
                                 // Display mode
                                 <>
                                     <div className="cell">{expense.category}</div>
                                     <div className="cell">{expense.item}</div>
                                     <div className="cell">{formatCurrency(expense.estimatedCost)}</div>
                                     <div className="cell">{formatCurrency(expense.actualCost)}</div>
                                     <div className="cell actions">
                                         <button
                                             onClick={() => handleEditExpense(expense)}
                                             className="action-button edit-button"
                                             title="Edit"
                                         >
                                             <Edit2 size={16} />
                                         </button>
                                         <button
                                             onClick={() => handleDeleteExpense(expense.id)}
                                             className="action-button delete-button"
                                             title="Delete"
                                         >
                                             <Trash2 size={16} />
                                         </button>
                                     </div>
                                 </>
                             )}
                         </div>
                     ))}
                 </div>
             </section>

             {/* Footer */}
             <footer className="app-footer">
                  {/* ... */}
             </footer>
        </div>
    );
}

export default BudgetPage;