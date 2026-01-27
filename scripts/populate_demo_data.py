import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import asyncio
import uuid

# MongoDB connection
mongo_url = "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_url)
db = client["test_database"]

async def populate_demo_data():
    print("🚀 Populating demo data...")
    
    # Demo Podcast Hosts
    demo_hosts = [
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@demo.com",
            "picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
            "podcast_name": "Tech Founders Unfiltered",
            "podcast_description": "Real conversations with startup founders about their journey, failures, and wins. No BS, just honest insights from the trenches.",
            "niche": ["Technology", "Business", "Entrepreneurship"],
            "topics": ["Startups", "Product Development", "Venture Capital", "Growth Hacking"],
            "audience_size": "10K-50K",
            "preferred_guest_type": ["Founder", "Expert"],
            "language": "English",
            "country": "United States",
            "recording_format": "remote",
            "availability": "Weekday mornings PST"
        },
        {
            "name": "Marcus Johnson",
            "email": "marcus.johnson@demo.com",
            "picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
            "podcast_name": "The Marketing Maven",
            "podcast_description": "Breaking down the latest marketing strategies, growth tactics, and brand storytelling with industry leaders.",
            "niche": ["Marketing", "Business"],
            "topics": ["Digital Marketing", "Content Strategy", "Social Media", "Brand Building"],
            "audience_size": "50K-100K",
            "preferred_guest_type": ["Expert", "Influencer"],
            "language": "English",
            "country": "United States",
            "recording_format": "remote",
            "availability": "Flexible, afternoons EST"
        },
        {
            "name": "Elena Rodriguez",
            "email": "elena.rodriguez@demo.com",
            "picture": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
            "podcast_name": "Wellness Warriors",
            "podcast_description": "Exploring holistic health, fitness, and mental wellness with experts who are changing lives.",
            "niche": ["Health", "Fitness", "Personal Development"],
            "topics": ["Nutrition", "Mental Health", "Fitness", "Mindfulness"],
            "audience_size": "10K-50K",
            "preferred_guest_type": ["Expert", "Storyteller"],
            "language": "English",
            "country": "Canada",
            "recording_format": "remote",
            "availability": "Evenings and weekends"
        },
        {
            "name": "David Park",
            "email": "david.park@demo.com",
            "picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
            "podcast_name": "Finance Friday",
            "podcast_description": "Making finance accessible. Weekly deep-dives into investing, wealth building, and financial independence.",
            "niche": ["Finance", "Business"],
            "topics": ["Investing", "Personal Finance", "Cryptocurrency", "Real Estate"],
            "audience_size": "100K+",
            "preferred_guest_type": ["Expert", "Researcher"],
            "language": "English",
            "country": "United States",
            "recording_format": "remote",
            "availability": "Fridays only"
        },
        {
            "name": "Priya Sharma",
            "email": "priya.sharma@demo.com",
            "picture": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
            "podcast_name": "EdTech Insights",
            "podcast_description": "The intersection of education and technology. Exploring how we're transforming learning for the next generation.",
            "niche": ["Education", "Technology"],
            "topics": ["Online Learning", "Educational Technology", "Future of Work", "Skills Development"],
            "audience_size": "10K-50K",
            "preferred_guest_type": ["Expert", "Founder"],
            "language": "English",
            "country": "United Kingdom",
            "recording_format": "remote",
            "availability": "Weekday afternoons GMT"
        },
        {
            "name": "Jamal Washington",
            "email": "jamal.washington@demo.com",
            "picture": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
            "podcast_name": "Culture Code",
            "podcast_description": "Conversations about culture, creativity, and the human experience with artists, creators, and changemakers.",
            "niche": ["Entertainment", "Personal Development"],
            "topics": ["Arts", "Culture", "Creativity", "Social Impact"],
            "audience_size": "10K-50K",
            "preferred_guest_type": ["Storyteller", "Influencer"],
            "language": "English",
            "country": "United States",
            "recording_format": "remote",
            "availability": "Evenings EST"
        },
        {
            "name": "Lisa Thompson",
            "email": "lisa.thompson@demo.com",
            "picture": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
            "podcast_name": "Science Simplified",
            "podcast_description": "Making complex science accessible and exciting. From quantum physics to climate change, we break it down.",
            "niche": ["Science", "Education"],
            "topics": ["Physics", "Biology", "Climate", "Innovation"],
            "audience_size": "50K-100K",
            "preferred_guest_type": ["Expert", "Researcher"],
            "language": "English",
            "country": "Canada",
            "recording_format": "remote",
            "availability": "Weekday mornings"
        },
        {
            "name": "Carlos Rivera",
            "email": "carlos.rivera@demo.com",
            "picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            "podcast_name": "Startup Stories",
            "podcast_description": "Behind-the-scenes stories from founders who've built successful companies from the ground up.",
            "niche": ["Business", "Technology"],
            "topics": ["Entrepreneurship", "Startups", "Leadership", "Innovation"],
            "audience_size": "100K+",
            "preferred_guest_type": ["Founder", "Expert"],
            "language": "English",
            "country": "Mexico",
            "recording_format": "remote",
            "availability": "Flexible schedule"
        }
    ]
    
    # Demo Podcast Guests
    demo_guests = [
        {
            "name": "Alex Thompson",
            "email": "alex.thompson@demo.com",
            "picture": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop",
            "bio": "Former VP of Engineering at a unicorn startup. Now advising early-stage tech companies on scaling engineering teams and building product culture.",
            "expertise": ["Technology", "Business", "Leadership"],
            "niche": ["Technology", "Business"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Weekday afternoons",
            "previous_appearances": ["TechCrunch Podcast", "Indie Hackers"]
        },
        {
            "name": "Dr. Maya Patel",
            "email": "maya.patel@demo.com",
            "picture": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop",
            "bio": "Clinical psychologist and bestselling author specializing in workplace mental health. Featured in NYT, Forbes, and Psychology Today.",
            "expertise": ["Health", "Personal Development", "Mental Wellness"],
            "niche": ["Health", "Personal Development"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Flexible schedule",
            "previous_appearances": ["The Tim Ferriss Show", "On Purpose with Jay Shetty"]
        },
        {
            "name": "Jordan Lee",
            "email": "jordan.lee@demo.com",
            "picture": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=400&h=400&fit=crop",
            "bio": "Growth marketing expert who scaled 3 startups from 0 to 8 figures. Speaker, consultant, and recovering perfectionist.",
            "expertise": ["Marketing", "Business", "Growth Strategy"],
            "niche": ["Marketing", "Business"],
            "language": "English",
            "country": "Singapore",
            "remote_recording": True,
            "availability": "Evenings APAC time",
            "previous_appearances": ["Marketing School", "Growth Everywhere"]
        },
        {
            "name": "Sophia Martinez",
            "email": "sophia.martinez@demo.com",
            "picture": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
            "bio": "Certified nutritionist and fitness coach with 15+ years experience. Passionate about making healthy living sustainable and joyful.",
            "expertise": ["Health", "Fitness", "Nutrition"],
            "niche": ["Health", "Fitness"],
            "language": "English",
            "country": "Spain",
            "remote_recording": True,
            "availability": "Mornings and evenings",
            "previous_appearances": ["The Model Health Show", "Mind Pump"]
        },
        {
            "name": "James Wilson",
            "email": "james.wilson@demo.com",
            "picture": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
            "bio": "CFP and wealth management advisor helping millennials build long-term wealth. Host of a popular finance YouTube channel with 200K+ subscribers.",
            "expertise": ["Finance", "Investing", "Personal Finance"],
            "niche": ["Finance", "Business"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Weekday mornings EST",
            "previous_appearances": ["BiggerPockets Money", "ChooseFI"]
        },
        {
            "name": "Olivia Brown",
            "email": "olivia.brown@demo.com",
            "picture": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
            "bio": "EdTech founder who built and sold an online learning platform to a Fortune 500 company. Now angel investing in education startups.",
            "expertise": ["Education", "Technology", "Entrepreneurship"],
            "niche": ["Education", "Technology"],
            "language": "English",
            "country": "Australia",
            "remote_recording": True,
            "availability": "Flexible, APAC hours preferred",
            "previous_appearances": ["The EdTech Podcast", "Course Creator Chronicles"]
        },
        {
            "name": "Ryan Cooper",
            "email": "ryan.cooper@demo.com",
            "picture": "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop",
            "bio": "AI researcher and tech ethicist exploring the societal impact of artificial intelligence. TEDx speaker and consultant to Fortune 500 companies.",
            "expertise": ["Technology", "Science", "Ethics"],
            "niche": ["Technology", "Science"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Afternoons PST",
            "previous_appearances": ["a16z Podcast", "The AI Alignment Podcast"]
        },
        {
            "name": "Kenji Tanaka",
            "email": "kenji.tanaka@demo.com",
            "picture": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop",
            "bio": "Product designer who's led design teams at top tech companies. Teaching the next generation of designers through workshops and mentorship.",
            "expertise": ["Technology", "Design", "Product"],
            "niche": ["Technology", "Business"],
            "language": "English",
            "country": "Japan",
            "remote_recording": True,
            "availability": "Evenings JST",
            "previous_appearances": ["Design Better Podcast", "High Resolution"]
        },
        {
            "name": "Amanda Foster",
            "email": "amanda.foster@demo.com",
            "picture": "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
            "bio": "Climate scientist and environmental advocate. Making climate science accessible through storytelling and compelling data visualization.",
            "expertise": ["Science", "Environment", "Education"],
            "niche": ["Science", "Education"],
            "language": "English",
            "country": "United Kingdom",
            "remote_recording": True,
            "availability": "Weekday mornings GMT",
            "previous_appearances": ["Science Vs", "The Climate Question"]
        },
        {
            "name": "Marcus Brown",
            "email": "marcus.brown@demo.com",
            "picture": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
            "bio": "Serial entrepreneur with 3 successful exits. Sharing lessons learned from building and selling companies across different industries.",
            "expertise": ["Business", "Entrepreneurship", "Leadership"],
            "niche": ["Business", "Technology"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Flexible schedule",
            "previous_appearances": ["How I Built This", "Masters of Scale"]
        },
        {
            "name": "Nina Rodriguez",
            "email": "nina.rodriguez@demo.com",
            "picture": "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop",
            "bio": "Social media strategist who's grown accounts to millions of followers. Teaching authentic personal branding and content creation.",
            "expertise": ["Marketing", "Social Media", "Content"],
            "niche": ["Marketing", "Business"],
            "language": "English",
            "country": "United States",
            "remote_recording": True,
            "availability": "Afternoons EST",
            "previous_appearances": ["Social Media Marketing Podcast", "The Goal Digger Podcast"]
        },
        {
            "name": "Dr. Samuel Lee",
            "email": "samuel.lee@demo.com",
            "picture": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
            "bio": "Neuroscientist researching the science of habit formation and behavioral change. Making neuroscience practical for everyday life.",
            "expertise": ["Science", "Health", "Personal Development"],
            "niche": ["Science", "Health"],
            "language": "English",
            "country": "Canada",
            "remote_recording": True,
            "availability": "Weekday evenings",
            "previous_appearances": ["Huberman Lab", "Found My Fitness"]
        }
    ]
    
    # Clear existing demo data
    await db.users.delete_many({"email": {"$regex": "@demo.com"}})
    await db.profiles.delete_many({"user_id": {"$regex": "demo_"}})
    
    print("\n📝 Creating demo hosts...")
    for host_data in demo_hosts:
        user_id = f"demo_host_{uuid.uuid4().hex[:8]}"
        
        # Create user
        user = {
            "user_id": user_id,
            "email": host_data["email"],
            "name": host_data["name"],
            "picture": host_data.get("picture", f"https://ui-avatars.com/api/?name={host_data['name'].replace(' ', '+')}&background=random"),
            "role": "host",
            "profile_completed": True,
            "subscription_tier": "free",
            "swipes_today": 0,
            "swipes_reset_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        
        # Create profile
        profile = {
            "user_id": user_id,
            "niche": host_data["niche"],
            "language": host_data["language"],
            "country": host_data["country"],
            "availability": host_data["availability"],
            "podcast_name": host_data["podcast_name"],
            "podcast_description": host_data["podcast_description"],
            "topics": host_data["topics"],
            "audience_size": host_data["audience_size"],
            "preferred_guest_type": host_data["preferred_guest_type"],
            "recording_format": host_data["recording_format"],
            "podcast_links": {
                "spotify": f"https://spotify.com/podcast/{user_id}",
                "apple": f"https://podcasts.apple.com/{user_id}",
                "youtube": ""
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.profiles.insert_one(profile)
        print(f"  ✅ Created host: {host_data['name']} - {host_data['podcast_name']}")
    
    print("\n📝 Creating demo guests...")
    for guest_data in demo_guests:
        user_id = f"demo_guest_{uuid.uuid4().hex[:8]}"
        
        # Create user
        user = {
            "user_id": user_id,
            "email": guest_data["email"],
            "name": guest_data["name"],
            "picture": guest_data.get("picture", f"https://ui-avatars.com/api/?name={guest_data['name'].replace(' ', '+')}&background=random"),
            "role": "guest",
            "profile_completed": True,
            "subscription_tier": "free",
            "swipes_today": 0,
            "swipes_reset_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        
        # Create profile
        profile = {
            "user_id": user_id,
            "niche": guest_data["niche"],
            "language": guest_data["language"],
            "country": guest_data["country"],
            "availability": guest_data["availability"],
            "bio": guest_data["bio"],
            "expertise": guest_data["expertise"],
            "previous_appearances": guest_data.get("previous_appearances", []),
            "social_links": {
                "linkedin": f"https://linkedin.com/in/{guest_data['name'].lower().replace(' ', '')}",
                "twitter": f"https://twitter.com/{guest_data['name'].split()[0].lower()}",
                "website": f"https://{guest_data['name'].lower().replace(' ', '')}.com"
            },
            "remote_recording": guest_data["remote_recording"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.profiles.insert_one(profile)
        print(f"  ✅ Created guest: {guest_data['name']} - {', '.join(guest_data['expertise'][:2])}")
    
    # Print summary
    total_users = await db.users.count_documents({})
    total_hosts = await db.users.count_documents({"role": "host"})
    total_guests = await db.users.count_documents({"role": "guest"})
    
    print(f"\n✨ Demo data populated successfully!")
    print(f"📊 Database stats:")
    print(f"   Total users: {total_users}")
    print(f"   Hosts: {total_hosts}")
    print(f"   Guests: {total_guests}")
    print(f"\n🎉 You can now test swiping with demo profiles!")

if __name__ == "__main__":
    asyncio.run(populate_demo_data())
