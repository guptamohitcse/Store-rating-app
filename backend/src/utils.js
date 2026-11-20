// Builds a safe ORDER BY clause. Only column names from the "allowed" map can be used,
// so nobody can inject SQL through the sort query parameter.
function buildOrder(allowed, sort, order, defaultKey) {
  const column = allowed[sort] || allowed[defaultKey];
  const direction = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${column} ${direction}`;
}

module.exports = { buildOrder };
