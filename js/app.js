function login() {
  const username = document.getElementById('username').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const error = document.getElementById('error');

  if (username === 'employee' && password === 'asif07') {
    localStorage.setItem('role', 'employee');
    window.location.href = 'employee.html';
  } else if (username === 'owner' && password === 'asif07') {
    localStorage.setItem('role', 'owner');
    window.location.href = 'owner.html';
  } else {
    error.textContent = 'Invalid username or password';
  }
}