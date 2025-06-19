# 🚀 Complete Setup Guide - Build From Scratch

This guide will walk you through building and running the TAP (Testing and Analysis Platform) application from scratch, even if you don't have Node.js or npm installed on your machine.

## 📋 Prerequisites Check

Before we start, let's check what you have installed. Open a terminal/command prompt and run:

```bash
node --version
npm --version
git --version
```

If any of these commands return "command not found" or similar errors, follow the installation steps below.

## 🛠️ Step 1: Install Required Software

### For macOS Users

#### Option A: Using Homebrew (Recommended)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js and npm**:
   ```bash
   brew install node
   ```

3. **Install Git** (if not already installed):
   ```bash
   brew install git
   ```

#### Option B: Using Official Installers

1. **Download Node.js**:
   - Go to [nodejs.org](https://nodejs.org/)
   - Download the LTS version (recommended)
   - Run the installer and follow the prompts
   - This automatically installs npm as well

2. **Download Git**:
   - Go to [git-scm.com](https://git-scm.com/download/mac)
   - Download and run the installer

### For Windows Users

#### Option A: Using Chocolatey (Recommended for developers)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run:
     ```powershell
     Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
     ```

2. **Install Node.js and Git**:
   ```powershell
   choco install nodejs git
   ```

#### Option B: Using Official Installers

1. **Download Node.js**:
   - Go to [nodejs.org](https://nodejs.org/)
   - Download the Windows LTS version
   - Run the `.msi` installer and follow the prompts
   - This automatically installs npm as well

2. **Download Git**:
   - Go to [git-scm.com/download/win](https://git-scm.com/download/win)
   - Download and run the installer
   - Use default settings (or customize as needed)

#### Option C: Using Windows Subsystem for Linux (WSL)

If you prefer a Linux-like environment on Windows:

1. **Install WSL2**:
   ```powershell
   wsl --install
   ```

2. **Follow the Linux instructions below** once WSL is set up.

### For Linux Users (Ubuntu/Debian)

1. **Update package list**:
   ```bash
   sudo apt update
   ```

2. **Install Node.js and npm**:
   ```bash
   # Install Node.js 18.x (LTS)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Git**:
   ```bash
   sudo apt install git
   ```

### For Linux Users (RHEL/CentOS/Fedora)

1. **Install Node.js and npm**:
   ```bash
   # For RHEL/CentOS
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

   # For Fedora
   sudo dnf install nodejs npm
   ```

2. **Install Git**:
   ```bash
   sudo yum install git  # RHEL/CentOS
   sudo dnf install git  # Fedora
   ```

## ✅ Step 2: Verify Installation

After installation, close and reopen your terminal, then verify everything is working:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show version information
```

**Expected output example:**
```
$ node --version
v18.19.0

$ npm --version
10.2.3

$ git --version
git version 2.39.2
```

## 📁 Step 3: Get the Project Code

### Option A: Clone from Repository (if you have access)

```bash
# Navigate to where you want the project
cd ~/Desktop  # or wherever you prefer

# Clone the repository
git clone <repository-url>
cd tap-nextjs
```

### Option B: Download Project Files

If you don't have repository access, you'll need the project files provided to you. Extract them to a folder like `~/Desktop/tap-nextjs`.

## 🔧 Step 4: Project Setup

1. **Navigate to the project directory**:
   ```bash
   cd tap-nextjs  # or whatever you named the folder
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```
   
   This will take a few minutes the first time. You should see output like:
   ```
   npm WARN deprecated ...
   added 1234 packages, and audited 1235 packages in 2m
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

4. **Edit the environment file**:
   
   **On macOS/Linux:**
   ```bash
   nano .env.local  # or use your preferred editor
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   notepad .env.local
   ```
   
   **On Windows (Command Prompt):**
   ```cmd
   notepad .env.local
   ```

5. **Configure your environment variables**:
   
   Replace the placeholder values with your actual client secrets:
   
   ```env
   # MIS GraphQL Development Environment
   MIS_GQL_DEV_CLIENT_SECRET=your_actual_dev_secret_here
   
   # MIS GraphQL Staging Environment
   MIS_GQL_STAGE_CLIENT_SECRET=your_actual_stage_secret_here
   
   # MIS GraphQL Production Environment
   MIS_GQL_PROD_CLIENT_SECRET=your_actual_prod_secret_here
   
   # MOGS GraphQL Development Environment
   MOGS_DEV_CLIENT_SECRET=your_actual_mogs_dev_secret_here
   
   # MOGS GraphQL Local Environment
   MOGS_LOCAL_CLIENT_SECRET=your_actual_mogs_local_secret_here
   
   # MOGS GraphQL Production Environment
   MOGS_PROD_CLIENT_SECRET=your_actual_mogs_prod_secret_here
   ```

   ⚠️ **Important**: 
   - Replace `your_actual_*_secret_here` with the real client secrets
   - Never commit this file to version control
   - If you don't have all secrets, comment out the lines with `#`

## 🏗️ Step 5: Build and Test

1. **Build the application**:
   ```bash
   npm run build
   ```
   
   This compiles the TypeScript and builds the production version. You should see:
   ```
   ✓ Compiled successfully in X seconds
   Route (app)                               Size     First Load JS
   ┌ ○ /                                    175 B    106 kB
   ├ ○ /_not-found                          990 B    103 kB
   ... (more routes)
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   ▲ Next.js 15.3.3
   - Local:        http://localhost:3000
   - Environments: .env.local
   
   ✓ Ready in 2.1s
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## 🎉 Step 6: Verify Everything Works

1. **Check the home page** - You should see the TAP application interface
2. **Test navigation** - Click through the sidebar menu items
3. **Try API testing** - Go to `/api-testing` and test a simple query
4. **Check environment switching** - Use the environment selector in the header

## 🐛 Troubleshooting Common Issues

### Issue: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # Linux/macOS
# or
rmdir /s node_modules && del package-lock.json  # Windows

# Reinstall
npm install
```

### Issue: "Permission denied" errors (Linux/macOS)

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill  # macOS/Linux
# or
netstat -ano | findstr :3000  # Windows (find PID, then taskkill /PID xxxx)

# Or use a different port
npm run dev -- -p 3001
```

### Issue: Environment variables not working

**Check:**
1. File is named `.env.local` (not `.env.local.txt`)
2. No spaces around the `=` sign
3. No quotes around values unless they contain spaces
4. File is in the root directory (same level as `package.json`)

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Check for TypeScript issues
npm run type-check

# Fix common issues
npm run lint
```

## 📚 Next Steps

Once you have the application running:

1. **Read the Documentation**: Visit `/documentation` in the app for feature details
2. **Explore the API Testing**: Use `/api-testing` to try GraphQL queries
3. **Check the Schema Browser**: Visit `/schema-browser` to explore the GraphQL schema
4. **Try Different Environments**: Switch between dev/staging/production using the header selector

## 🆘 Getting Help

If you run into issues:

1. **Check the console** in your browser's Developer Tools (F12)
2. **Look at the terminal** where you ran `npm run dev` for server errors
3. **Try the debug page** at `/debug` in the application
4. **Verify your environment variables** are correctly set

## 🔄 Development Workflow

For ongoing development:

```bash
# Start development server
npm run dev

# In another terminal, run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Production Deployment

For deployment to production:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to your platform** (Vercel, AWS, etc.):
   - Configure environment variables on your platform
   - Deploy the built application
   - Ensure all client secrets are properly configured

Congratulations! You should now have the TAP application running successfully. The platform provides comprehensive tools for testing and managing GraphQL APIs for missionary information systems.
