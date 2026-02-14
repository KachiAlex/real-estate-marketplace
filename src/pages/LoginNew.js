import React from 'react';

export const Login = () => {
  return (
    <div>
      <h1>Login (stub)</h1>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" placeholder="you@example.com" />
    </div>
  );
};

const LoginNew = Login;

export default LoginNew;
