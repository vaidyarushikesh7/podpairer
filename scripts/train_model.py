import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.ml_models.collaborative_filter import PodcastRecommender
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def train_collaborative_model():
    """Train the collaborative filtering model using swipe data"""
    
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    logger.info("Fetching swipe data from database...")
    
    # Get all swipes
    swipes_cursor = db.swipes.find({}, {"_id": 0})
    swipes = await swipes_cursor.to_list(10000)
    
    logger.info(f"Found {len(swipes)} swipes in database")
    
    if len(swipes) < 10:
        logger.warning("Not enough swipes to train model. Need at least 10 swipes.")
        logger.info("Creating some synthetic training data for demonstration...")
        
        # Get demo users
        hosts = await db.users.find({"role": "host"}, {"_id": 0, "user_id": 1}).to_list(10)
        guests = await db.users.find({"role": "guest"}, {"_id": 0, "user_id": 1}).to_list(10)
        
        if hosts and guests:
            # Create synthetic swipes for demo
            import random
            synthetic_swipes = []
            
            for host in hosts:
                # Each host swipes on 3-5 random guests
                num_swipes = random.randint(3, 5)
                selected_guests = random.sample(guests, min(num_swipes, len(guests)))
                
                for guest in selected_guests:
                    # 70% right swipe, 30% left swipe
                    direction = "right" if random.random() > 0.3 else "left"
                    synthetic_swipes.append({
                        "swiper_id": host["user_id"],
                        "swiped_id": guest["user_id"],
                        "direction": direction
                    })
            
            swipes = synthetic_swipes
            logger.info(f"Created {len(swipes)} synthetic swipes for training")
    
    # Initialize recommender
    recommender = PodcastRecommender()
    
    # Train model
    logger.info("Training collaborative filtering model...")
    recommender.train_model(swipes, epochs=20)
    
    logger.info("Model training completed!")
    
    # Test recommendation
    if swipes:
        test_user_id = swipes[0]['swiper_id']
        test_candidates = [s['swiped_id'] for s in swipes[:5]]
        
        recommendations = recommender.recommend(test_user_id, test_candidates, top_k=5)
        
        logger.info(f"\nTest recommendations for user {test_user_id}:")
        for item_id, score in recommendations:
            logger.info(f"  Item: {item_id}, Score: {score:.4f}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(train_collaborative_model())