# Demo Spec: {{demo_name}}

## System Details

- **Niche:** {{niche}}
- **Business result:** {{business_result}}
- **Recommended demo type:** {{demo_type}}
- **Build complexity:** low / medium / high

## Customer-Facing Screens

### 1. Landing Page

**Purpose:** Capture initial inquiry and build trust

**Elements:** 
- Headline (business result-focused)
- Brief explanation
- Simple intake form
- Trust indicators

### 2. Intake Form

**Purpose:** Qualify the lead

**Fields:**
- 
- 
- 

**Automation trigger:** Send confirmation and notify owner

## Owner-Facing Screens

### 1. Dashboard

**Purpose:** Show new leads, status, and follow-up actions at a glance

**Metrics:**
- New leads this week
- Leads needing follow-up
- Converted leads
- Referrals tracked

### 2. Lead Detail

**Purpose:** View lead info and history

**Shows:**
- Lead source
- Qualification status
- Follow-up history
- Next action

### 3. Automations Queue

**Purpose:** Track automated follow-ups

**Shows:**
- Pending emails/SMS/WhatsApp
- Scheduled sends
- Delivery status

## Automations

1. **Lead arrives** → Send confirmation email + notify owner
2. **Day 1 follow-up** → Send follow-up email
3. **Day 3 follow-up** → Send SMS/WhatsApp
4. **Day 7 follow-up** → Email reminder to owner
5. **Booking made** → Send thank you + request review

## Data Model

```json
{
  "leads": {
    "id": "uuid",
    "source": "string",
    "status": "new|qualified|contacted|booked|won|lost",
    "contact_info": {},
    "created_at": "timestamp"
  },
  "automations": {
    "id": "uuid",
    "lead_id": "uuid",
    "type": "email|sms|whatsapp",
    "scheduled_at": "timestamp",
    "sent_at": "timestamp"
  },
  "referrals": {
    "id": "uuid",
    "from_partner": "string",
    "led_to": "string",
    "commission_owed": "number"
  }
}
```
