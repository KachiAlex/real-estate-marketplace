const mockUsers = require('../data/mockUsers');
const emails = mockUsers.map(u => u.email).filter(Boolean);
console.log(JSON.stringify(emails, null, 2));
