# AI Voice Billing & Inventory Management System

A modern, responsive frontend application built with React.js and Tailwind CSS for managing inventory and billing through voice commands.

## 🎯 Features


### �📊 Dashboard
- Sales summary (Today, Weekly, Monthly)
- Top selling items display
- Low stock alerts
- Quick action shortcuts

### 🎙️ Voice Billing
- Voice input simulation for billing
- Automatic command parsing (e.g., "2 kilo cheeni")
- Real-time bill generation
- Item management in cart

### 📦 Inventory Management
- Complete item listing with search and filters
- Category-wise filtering
- Stock status indicators (Critical, Low, Good)
- Add new items (modal interface)
- Edit existing items (full CRUD)
- Delete items with confirmation
- **LocalStorage persistence** - All data saved in browser

### 📒 Udhar Khata (Credit Book)
- Customer credit tracking
- Payment status management
- Due date monitoring with overdue alerts
- Filter by paid/unpaid status

### 📈 Reports & Analytics
- Daily sales trend line chart
- Item frequency bar chart
- Detailed sales summary table
- Date range and category filters

### ⚙️ Settings
- Theme toggle (Light/Dark mode)
- Voice model configuration
- Language settings (English/Urdu/Bilingual)

## 🚀 Technologies Used

- **React.js** - Frontend framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Lucide React** - Icons

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- 📱 Mobile devices
- 💻 Tablets
- 🖥️ Desktop screens

## 🎨 UI Features

- Clean and modern interface
- Dark mode support
- Smooth animations and transitions
- Mobile-friendly navigation with sidebar
- Card-based layouts
- Interactive charts and graphs

## 📦 Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:5173`

## 🎮 Usage

### Dashboard
- View sales summary and quick stats
- Click on quick action buttons to navigate

### Voice Billing
- Click the microphone icon to simulate voice input
- Random commands will be generated (e.g., "2 kilo cheeni")
- Add parsed items to bill
- Generate final bill

### Inventory
- Search items by name
- Filter by category
- View stock status
- Add new items using the modal

### Udhar Khata
- View all customer credits
- Filter by payment status
- Mark entries as paid/unpaid
- Add new credit entries

### Reports
- Select date range and category
- View sales trends and item frequency
- Analyze sales summary table

### Settings
- Toggle between light and dark themes
- Configure voice recognition settings
- Manage users and shopkeepers

## 🔧 Build for Production

```powershell
npm run build
```

The production-ready files will be in the `dist` folder.

## 📝 Notes

- This is a **frontend-only** application
- **No authentication required** - Start using immediately
- Voice recognition is **simulated** with mock data
- All data is stored in **browser localStorage** (persists across sessions)
- No backend or database required - runs entirely in the browser

## 🎯 Future Enhancements

- Real voice recognition API integration
- Export reports to PDF/Excel
- Multi-language full support
- PWA support for offline usage
- Cloud backup for localStorage data
- Advanced analytics and insights

## 🌐 Browser Support

- Chrome (Recommended)
- Firefox
- Safari
- Edge

## 📄 License

This is a demo project for educational purposes.

---

**Built with ❤️ using React + Tailwind CSS**
