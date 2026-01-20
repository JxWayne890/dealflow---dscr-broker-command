# Consolidated SQL Schema

I have organized the database schema into logical categories to make it easier to manage. You can run these files in order in your Supabase SQL Editor.

### 1. [01_profiles_and_team.sql](file:///Users/john/Downloads/dealflow---dscr-broker-command/supabase/consolidated/01_profiles_and_team.sql)
Sets up user profiles with timezones, roles, and the team invitation system.

### 2. [02_campaign_system.sql](file:///Users/john/Downloads/dealflow---dscr-broker-command/supabase/consolidated/02_campaign_system.sql)
Creates the core tables for the automated campaign system (Campaigns, Steps, Subscriptions, and Events).

### 3. [03_organization_security.sql](file:///Users/john/Downloads/dealflow---dscr-broker-command/supabase/consolidated/03_organization_security.sql)
Implements the organization-aware Row Level Security (RLS) policies that allow admins and assistants to share data securely.

### 4. [04_seeds.sql](file:///Users/john/Downloads/dealflow---dscr-broker-command/supabase/consolidated/04_seeds.sql)
Populates the database with the default "Cold Lead Revival" campaign sequence.
