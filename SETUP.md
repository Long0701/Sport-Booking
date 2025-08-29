# Sport Booking Platform Setup Guide

## Environment Variables

You need to create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Configuration (OPTIONAL)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Weather API (OPTIONAL)
WEATHER_API_KEY=your-weather-api-key

# File Upload (OPTIONAL)
UPLOAD_SECRET=your-upload-secret-key
```

## Database Setup

1. **Install PostgreSQL** if you haven't already
2. **Create a database**:
   ```sql
   CREATE DATABASE sportbooking;
   ```
3. **Run the setup script**:
   ```bash
   psql -d sportbooking -f scripts/setup-database.sql
   ```

## Quick Test

After setting up the environment variables and database:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the environment**:
   - Visit: `http://localhost:3000/api/env-check`
   - This will show you which environment variables are set

3. **Test the database connection**:
   - Visit: `http://localhost:3000/api/test`
   - This will test if the database connection is working

## Common Issues

### Internal Server Error
- **Missing DATABASE_URL**: Make sure you have set the DATABASE_URL in your `.env` file
- **Database not running**: Ensure PostgreSQL is running
- **Wrong database credentials**: Check your username, password, and database name

### Database Connection Failed
- **PostgreSQL not installed**: Install PostgreSQL first
- **Database doesn't exist**: Create the database using the setup script
- **Wrong port**: Default PostgreSQL port is 5432

## Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Set up database** (see above)

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Default Users

After running the setup script, you'll have these default users:

- **Regular User**: `user1@example.com` / `123456`
- **Court Owner**: `owner1@example.com` / `123456`
- **Admin**: `admin@example.com` / `123456`
