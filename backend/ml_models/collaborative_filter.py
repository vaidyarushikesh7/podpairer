import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from pathlib import Path
import pickle
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class NeuralCollaborativeFiltering(nn.Module):
    """Neural Collaborative Filtering model for podcast matching"""
    
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 32, hidden_dims: List[int] = [64, 32, 16]):
        super(NeuralCollaborativeFiltering, self).__init__()
        
        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        
        # User and item embeddings
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        
        # MLP layers
        layers = []
        input_dim = embedding_dim * 2
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(nn.Dropout(0.2))
            input_dim = hidden_dim
        
        # Output layer
        layers.append(nn.Linear(input_dim, 1))
        layers.append(nn.Sigmoid())
        
        self.mlp = nn.Sequential(*layers)
        
        # Initialize weights
        self._init_weights()
    
    def _init_weights(self):
        """Initialize model weights"""
        nn.init.normal_(self.user_embedding.weight, std=0.01)
        nn.init.normal_(self.item_embedding.weight, std=0.01)
        
        for layer in self.mlp:
            if isinstance(layer, nn.Linear):
                nn.init.xavier_uniform_(layer.weight)
                nn.init.zeros_(layer.bias)
    
    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        """Forward pass"""
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)
        
        # Concatenate embeddings
        x = torch.cat([user_emb, item_emb], dim=1)
        
        # Pass through MLP
        output = self.mlp(x)
        
        return output.squeeze()
    
    def predict(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> np.ndarray:
        """Predict scores for user-item pairs"""
        self.eval()
        with torch.no_grad():
            scores = self.forward(user_ids, item_ids)
            return scores.cpu().numpy()


class CollaborativeFilterTrainer:
    """Trainer for collaborative filtering model"""
    
    def __init__(self, model: NeuralCollaborativeFiltering, learning_rate: float = 0.001):
        self.model = model
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.BCELoss()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
    
    def train_epoch(self, train_data: List[Tuple[int, int, float]], batch_size: int = 128) -> float:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0.0
        num_batches = 0
        
        # Shuffle data
        np.random.shuffle(train_data)
        
        for i in range(0, len(train_data), batch_size):
            batch = train_data[i:i+batch_size]
            
            user_ids = torch.tensor([x[0] for x in batch], dtype=torch.long).to(self.device)
            item_ids = torch.tensor([x[1] for x in batch], dtype=torch.long).to(self.device)
            labels = torch.tensor([x[2] for x in batch], dtype=torch.float32).to(self.device)
            
            # Forward pass
            predictions = self.model(user_ids, item_ids)
            loss = self.criterion(predictions, labels)
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
        
        return total_loss / num_batches if num_batches > 0 else 0.0
    
    def train(self, train_data: List[Tuple[int, int, float]], epochs: int = 10, batch_size: int = 128):
        """Train the model"""
        logger.info(f"Training collaborative filtering model for {epochs} epochs...")
        
        for epoch in range(epochs):
            loss = self.train_epoch(train_data, batch_size)
            logger.info(f"Epoch {epoch+1}/{epochs}, Loss: {loss:.4f}")
        
        logger.info("Training completed!")


class PodcastRecommender:
    """Podcast recommendation system using collaborative filtering"""
    
    def __init__(self, model_path: str = "/app/backend/ml_models/cf_model.pt"):
        self.model_path = Path(model_path)
        self.model = None
        self.user_id_map = {}  # user_id -> index
        self.item_id_map = {}  # item_id -> index
        self.reverse_item_map = {}  # index -> item_id
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load model if exists
        if self.model_path.exists():
            self.load_model()
    
    def build_id_mappings(self, user_ids: List[str], item_ids: List[str]):
        """Build mappings between user/item IDs and indices"""
        self.user_id_map = {uid: idx for idx, uid in enumerate(set(user_ids))}
        self.item_id_map = {iid: idx for idx, iid in enumerate(set(item_ids))}
        self.reverse_item_map = {idx: iid for iid, idx in self.item_id_map.items()}
    
    def prepare_training_data(self, swipes: List[Dict]) -> List[Tuple[int, int, float]]:
        """Prepare training data from swipes
        
        Args:
            swipes: List of swipe records with swiper_id, swiped_id, direction
        
        Returns:
            List of (user_idx, item_idx, label) tuples
        """
        training_data = []
        
        for swipe in swipes:
            user_id = swipe['swiper_id']
            item_id = swipe['swiped_id']
            direction = swipe['direction']
            
            # Map to indices
            if user_id in self.user_id_map and item_id in self.item_id_map:
                user_idx = self.user_id_map[user_id]
                item_idx = self.item_id_map[item_id]
                label = 1.0 if direction == 'right' else 0.0
                
                training_data.append((user_idx, item_idx, label))
        
        return training_data
    
    def train_model(self, swipes: List[Dict], epochs: int = 10):
        """Train the collaborative filtering model"""
        if len(swipes) < 10:
            logger.warning("Not enough swipe data to train model (need at least 10 swipes)")
            return
        
        # Extract user and item IDs
        user_ids = [s['swiper_id'] for s in swipes]
        item_ids = [s['swiped_id'] for s in swipes]
        
        # Build mappings
        self.build_id_mappings(user_ids, item_ids)
        
        # Prepare training data
        training_data = self.prepare_training_data(swipes)
        
        if len(training_data) < 10:
            logger.warning("Not enough training data after filtering")
            return
        
        # Initialize model
        num_users = len(self.user_id_map)
        num_items = len(self.item_id_map)
        
        self.model = NeuralCollaborativeFiltering(
            num_users=num_users,
            num_items=num_items,
            embedding_dim=32,
            hidden_dims=[64, 32, 16]
        )
        
        # Train
        trainer = CollaborativeFilterTrainer(self.model)
        trainer.train(training_data, epochs=epochs)
        
        # Save model
        self.save_model()
        
        logger.info(f"Model trained with {num_users} users and {num_items} items")
    
    def recommend(self, user_id: str, candidate_ids: List[str], top_k: int = 10) -> List[Tuple[str, float]]:
        """Get recommendations for a user
        
        Args:
            user_id: User ID to get recommendations for
            candidate_ids: List of candidate item IDs
            top_k: Number of top recommendations to return
        
        Returns:
            List of (item_id, score) tuples sorted by score
        """
        if self.model is None:
            # Model not trained yet, return candidates in original order with neutral scores
            return [(cid, 0.5) for cid in candidate_ids[:top_k]]
        
        # Check if user exists in mapping
        if user_id not in self.user_id_map:
            # New user, return candidates with neutral scores
            return [(cid, 0.5) for cid in candidate_ids[:top_k]]
        
        user_idx = self.user_id_map[user_id]
        
        # Filter candidates that exist in item mapping
        valid_candidates = [(cid, self.item_id_map[cid]) for cid in candidate_ids if cid in self.item_id_map]
        
        if not valid_candidates:
            # No valid candidates, return originals
            return [(cid, 0.5) for cid in candidate_ids[:top_k]]
        
        # Predict scores
        self.model.eval()
        self.model.to(self.device)
        
        candidate_item_ids = [c[1] for c in valid_candidates]
        user_indices = torch.tensor([user_idx] * len(candidate_item_ids), dtype=torch.long).to(self.device)
        item_indices = torch.tensor(candidate_item_ids, dtype=torch.long).to(self.device)
        
        with torch.no_grad():
            scores = self.model(user_indices, item_indices).cpu().numpy()
        
        # Combine with original IDs and sort
        recommendations = [(valid_candidates[i][0], float(scores[i])) for i in range(len(scores))]
        recommendations.sort(key=lambda x: x[1], reverse=True)
        
        # Add candidates that weren't in the model with neutral scores
        unseen_candidates = [cid for cid in candidate_ids if cid not in self.item_id_map]
        recommendations.extend([(cid, 0.5) for cid in unseen_candidates])
        
        return recommendations[:top_k]
    
    def save_model(self):
        """Save model and mappings"""
        if self.model is None:
            return
        
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'user_id_map': self.user_id_map,
            'item_id_map': self.item_id_map,
            'reverse_item_map': self.reverse_item_map,
            'num_users': self.model.num_users,
            'num_items': self.model.num_items,
            'embedding_dim': self.model.embedding_dim
        }
        
        torch.save(checkpoint, self.model_path)
        logger.info(f"Model saved to {self.model_path}")
    
    def load_model(self):
        """Load model and mappings"""
        if not self.model_path.exists():
            logger.warning(f"Model file not found at {self.model_path}")
            return
        
        try:
            checkpoint = torch.load(self.model_path, map_location=self.device)
            
            # Restore mappings
            self.user_id_map = checkpoint['user_id_map']
            self.item_id_map = checkpoint['item_id_map']
            self.reverse_item_map = checkpoint['reverse_item_map']
            
            # Recreate model
            self.model = NeuralCollaborativeFiltering(
                num_users=checkpoint['num_users'],
                num_items=checkpoint['num_items'],
                embedding_dim=checkpoint['embedding_dim']
            )
            
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            logger.info(f"Model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None


# Global recommender instance
recommender = PodcastRecommender()