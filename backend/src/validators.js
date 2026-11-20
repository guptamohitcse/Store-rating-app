const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

const nameError = (name = '') =>
  name.trim().length < 20 || name.trim().length > 60 ? 'Name must be between 20 and 60 characters' : null;

const emailError = (email = '') => (emailRegex.test(email.trim()) ? null : 'Please enter a valid email address');

const addressError = (address = '') => {
  if (!address.trim()) return 'Address is required';
  return address.length > 400 ? 'Address can be at most 400 characters' : null;
};

const passwordError = (password = '') =>
  passwordRegex.test(password)
    ? null
    : 'Password must be 8-16 characters with at least one uppercase letter and one special character';

// Returns a list of error messages (empty list = all good)
function validateUser({ name, email, address, password }) {
  return [nameError(name), emailError(email), addressError(address), passwordError(password)].filter(Boolean);
}

function validateStore({ name, email, address }) {
  return [nameError(name), emailError(email), addressError(address)].filter(Boolean);
}

module.exports = { validateUser, validateStore, passwordError };
