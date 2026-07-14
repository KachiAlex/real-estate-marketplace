
      -- Update admin user with proper password hash
      UPDATE users 
      SET password = '$2b$12$7GFmucBlan4gLu3v9UqcKu83fP422lJO/Foy5TpwA0RCk10ECQ0J6', isActive = true, isVerified = true
      WHERE email = 'admin@propertyark.com';
      
      -- Verify update
      SELECT email, role, isActive, isVerified FROM users WHERE email = 'admin@propertyark.com';
    