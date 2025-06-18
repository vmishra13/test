const bcrypt = require('bcrypt');
const saltRounds = 12;
const newPassword = 'TempPass123!';

bcrypt
  .hash(newPassword, saltRounds)
  .then(hashedPassword => {
    console.log('Hashed Password:', hashedPassword);
  })
  .catch(error => {
    console.error('Error:', error);
  });
