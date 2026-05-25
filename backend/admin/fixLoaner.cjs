const fs = require('fs');
const file = 'src/pages/LoanerManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Interface
content = content.replace(/status: 'Available' \| 'Lent' \| 'Maintenance';/g, "status: 'available' | 'loaned' | 'maintenance';");

// 2. Forms initial state
content = content.replace(/status: 'Available'/g, "status: 'available'");

// 3. fetchLoaners filter mapping
content = content.replace(
    /status: filterStatus !== 'All' \? filterStatus : ''/,
    "status: filterStatus === 'Available' ? 'available' : filterStatus === 'Lent' ? 'loaned' : filterStatus === 'Maintenance' ? 'maintenance' : ''"
);

// 4. StatusBadge mapping
content = content.replace(/status === 'Lent'/g, "status === 'loaned'");
content = content.replace(/'Available': \{ colors: 'bg-emerald/g, "'available': { colors: 'bg-emerald");
content = content.replace(/'Lent': \{ colors: 'bg-blue/g, "'loaned': { colors: 'bg-blue");
content = content.replace(/'Maintenance': \{ colors: 'bg-amber/g, "'maintenance': { colors: 'bg-amber");

// 5. Card rendering conditionals
content = content.replace(/loaner\.status === 'Lent'/g, "loaner.status === 'loaned'");
content = content.replace(/loaner\.status === 'Maintenance'/g, "loaner.status === 'maintenance'");
content = content.replace(/loaner\.status === 'Available'/g, "loaner.status === 'available'");

fs.writeFileSync(file, content);
console.log('Fixed LoanerManager statuses!');
