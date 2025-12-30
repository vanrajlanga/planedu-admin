# PlanEdu Admin Panel

Next.js-based admin dashboard for the PlanEdu Education Platform. A comprehensive management system for colleges, courses, exams, users, and content.

## Features

- ✅ **Dashboard Analytics** - Real-time statistics and charts
- ✅ **User Management** - Complete user administration with roles and permissions
- ✅ **College Management** - Add, edit, and manage college listings
- ✅ **Course Management** - Course catalog administration
- ✅ **Exam Management** - Manage entrance exams and test information
- ✅ **Scholarship Management** - Scholarship program administration
- ✅ **Review Moderation** - Approve, reject, and manage user reviews
- ✅ **News/Blog Management** - Create and publish news articles
- ✅ **Banner Management** - Dynamic banner system with placement controls
- ✅ **FAQ Management** - Frequently asked questions administration
- ✅ **Settings** - Configurable application settings
- ✅ **Rich Text Editor** - TipTap editor with formatting, tables, images, and links
- ✅ **Responsive Design** - Mobile-friendly interface

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **React:** React 19
- **Styling:** Tailwind CSS 4
- **HTTP Client:** Axios
- **Rich Text Editor:** TipTap
- **Charts:** Recharts
- **Notifications:** React Hot Toast
- **Testing:** Playwright
- **Node Version:** 18+ recommended

## Project Structure

```
admin/
├── app/
│   ├── banners/              # Banner management
│   ├── colleges/             # College CRUD operations
│   ├── courses/              # Course management
│   ├── dashboard/            # Analytics dashboard
│   ├── exams/                # Exam management
│   ├── faqs/                 # FAQ management
│   ├── login/                # Admin authentication
│   ├── news/                 # News/blog management
│   ├── placements/           # Placement statistics
│   ├── reviews/              # Review moderation
│   ├── scholarships/         # Scholarship management
│   ├── settings/             # Application settings
│   ├── users/                # User management
│   ├── components/
│   │   ├── AdminLayout.js    # Main layout with sidebar
│   │   └── RichTextEditor.js # TipTap editor component
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout
│   └── page.js               # Home/redirect page
├── lib/
│   └── api.js                # API client with interceptors
├── tests/
│   └── rich-text-editor.spec.js  # Playwright tests
├── .env.example              # Environment variables template
├── .gitignore
├── jsconfig.json             # Path aliases configuration
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:vanrajlanga/planedu-admin.git
   cd planedu-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env.local
   ```

   Update the `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   NEXT_PUBLIC_APP_NAME=PlanEdu Admin
   ```

4. **Ensure the backend API is running**

   The admin panel connects to the PlanEdu backend API. Make sure it's running on `http://localhost:3000`.

   See the [backend repository](https://github.com/vanrajlanga/planedu-backend) for setup instructions.

## Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

The admin panel will start on `http://localhost:3001`

### Production Build
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

## Default Admin Credentials

After importing the database, you can log in with:

```
Email: admin@planedu.com
Password: Admin@123
```

**⚠️ Important:** Change the default password immediately after first login.

## Key Features

### Dashboard
- User statistics and growth charts
- Recent activity feed
- Quick stats overview (total users, colleges, courses, etc.)
- Analytics with date range filters

### College Management
- Create, read, update, delete colleges
- Upload college logos and images
- Rich text descriptions
- Affiliation and accreditation management
- Bulk status updates

### Course Management
- Course catalog administration
- Degree type and specialization filters
- Duration and fee management
- Eligibility criteria configuration

### User Management
- User listing with search and filters
- Role assignment (Admin, Student, Counselor)
- Email verification management
- User activity logs
- Bulk operations

### Review Moderation
- Approve/reject user-submitted reviews
- Reply to reviews
- Rating analytics
- Bulk moderation tools

### Rich Text Editor
- Formatting (bold, italic, underline, headings)
- Lists (ordered, unordered)
- Tables with cell merging
- Image uploads
- Links
- Text alignment
- Syntax highlighting

### Banner Management
- Dynamic banner system
- Placement targeting (homepage, college page, etc.)
- Click tracking and analytics
- Schedule banners with start/end dates
- Priority ordering

## API Integration

The admin panel uses Axios with configured interceptors for:
- Automatic JWT token injection
- Automatic redirect on 401 (unauthorized)
- Error handling
- Request/response logging

All API calls are centralized in `lib/api.js` for easy maintenance.

## Authentication Flow

1. User enters credentials on login page
2. Backend validates and returns JWT token
3. Token stored in `localStorage`
4. Token automatically attached to all API requests
5. On 401 response, user redirected to login

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `PlanEdu Admin` |
| `NODE_ENV` | Environment mode | `development` |

## Development

### Code Style
- Use functional components with hooks
- Keep components modular and reusable
- Use async/await for API calls
- Handle loading and error states
- Show user feedback with toast notifications

### Adding New Features

1. Create page in `app/[feature]/page.js`
2. Add API methods in `lib/api.js`
3. Update navigation in `app/components/AdminLayout.js`
4. Add tests in `tests/` directory

## Testing

The project uses Playwright for E2E testing.

Run all tests:
```bash
npm test
```

Run specific test:
```bash
npx playwright test tests/rich-text-editor.spec.js
```

## Troubleshooting

### API Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Ensure the backend API is running on port 3000

### Authentication Errors
```
401 Unauthorized
```
**Solution:** Check if admin token is valid. Try logging out and logging in again.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Change the port or kill the process using port 3001
```bash
lsof -ti:3001 | xargs kill -9
# Or run on different port
npm run dev -- -p 3002
```

### Build Errors
```
Error: Module not found
```
**Solution:** Clear cache and reinstall dependencies
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Security

- JWT-based authentication
- Protected routes (redirect to login if not authenticated)
- Automatic token refresh
- XSS prevention with React's built-in escaping
- CORS configured on backend
- Input validation on all forms

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Next.js automatic code splitting
- Image optimization with Next.js Image component
- Lazy loading for heavy components
- API response caching
- Debounced search inputs

## Future Enhancements

- [ ] Role-based access control (RBAC)
- [ ] Advanced analytics with custom reports
- [ ] Export data to CSV/Excel
- [ ] Email templates management
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Real-time notifications
- [ ] Audit logs
- [ ] Two-factor authentication

## Related Repositories

- **Backend API:** [planedu-backend](https://github.com/vanrajlanga/planedu-backend)

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for PlanEdu**
