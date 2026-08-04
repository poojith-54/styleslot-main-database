# StyleSlot - Premium Grooming Marketplace

StyleSlot is a premium multi-role landing and scheduling application for high-end barbershops, salon owners, and stylists. It integrates **Supabase** for secure database operations, authentication, and RLS (Row Level Security), and leverages **Gemini 3.5 Flash** for virtual hair styling analysis and customer conversational recommendations.

## 🚀 Key Features
- **Supabase Authentication**: Integrated Email & Password registration/login with dynamic role selection (Customer, Shop Owner, Stylist/Barber).
- **Normalized PostgreSQL Database**: Full database migration schema for profiles, salons, services, rosters, coupons, and appointments.
- **Premium Admin Console (CMS)**: 
  - Dynamic customization of landing titles, banners, about section descriptions, social links, FAQs, and testimonials with zero code modifications.
  - Interactive user directories allowing direct role promotions/demotions.
  - Verification controls for active salons.
  - Simulated analytics dashboards with financial SVG charts.
- **Geographic Mock Map**: Visual coordinates pinning for nearby shops.
- **Vercel Serverless Architecture**: Configured routes and entrypoints for direct hosting on Vercel.

---

## 📁 Project Folder Structure
```
├── api/
│   └── index.ts                 # Vercel serverless function entrypoint (Express wrapper)
├── src/
│   ├── components/
│   │   ├── AdminConsole.tsx     # Upgraded CMS operational desk
│   │   ├── AiStylingAssistant.ts# AI facial scanning & chat UI
│   │   ├── CheckoutWizard.tsx   # Appointment booking & checkout flow
│   │   ├── LoginScreen.tsx      # Supabase Sign In / Sign Up UI
│   │   ├── MockMap.tsx          # Stylist geo-pins map UI
│   │   ├── OwnerDashboard.tsx   # Salon owner panel
│   │   ├── RoleSwitcher.tsx     # Interactive simulator role pill
│   │   └── StylistWorkspace.tsx # Roster schedule panel
│   ├── App.tsx                  # Core React orchestration & auth state check
│   ├── main.tsx                 # Client entry point
│   ├── types.ts                 # TypeScript model definitions
│   └── supabase.ts              # Client-side Supabase SDK configurations
├── server.ts                    # Backend Node Express API routes & Gemini integration
├── supabase_schema.sql          # PostgreSQL schema migrations & seed queries
├── vercel.json                  # Vercel routing configurations
└── package.json                 # Dependency manifests
```

---

## 🛠️ Local Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Supabase Account** (with a new empty project)
- **Gemini API Key** (from Google AI Studio)

### 2. Database Migrations
1. Open your project on the **Supabase Dashboard**.
2. Navigate to the **SQL Editor** tab.
3. Copy the contents of the `supabase_schema.sql` file in this repository and paste it into the editor.
4. Click **Run** to execute the script. This creates all normalized tables, triggers, policies, and seeds baseline salon listings.

### 3. Configure Environment Settings
Create a `.env` file in the root directory and specify the following parameters (use `.env.example` as a template):
```env
# Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Supabase Public Keys (React Frontend client)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Supabase Private Keys (Express Backend server)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-private-key"
```
> ⚠️ **Security Warning**: Do not share or commit `SUPABASE_SERVICE_ROLE_KEY` to public repositories as it bypasses Row Level Security.

### 4. Install & Launch
```bash
# Install dependencies
npm install

# Start local Vite development server & Express API backend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Administrative Setup & Roles

### Signing Up
1. Open the application (you will see the Login/Sign-up screen).
2. Choose **Sign Up** and select your desired role tier:
   - **Customer**: Standard client.
   - **Shop Owner**: Access to manage shop listings and rosters.
   - **Stylist/Staff**: Access to manage daily booking completed queues.
3. After registration, a record is automatically created in the Supabase `profiles` table via PostgreSQL triggers.

### Creating an Admin
To access the **Admin Console** and CMS editor:
1. Log in to your **Supabase Dashboard**.
2. Click **Table Editor** -> Select the `profiles` table.
3. Find your registered user profile and double-click the `role` field.
4. Modify the value from `'customer'` to `'admin'` and save the changes.
5. Refresh the application. The operational role switcher will now show the **Admin Console** tab where you can customize theme colors, hero banners, and FAQs live.
