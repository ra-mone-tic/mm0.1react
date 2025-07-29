"""
AI Recommendations Module for MeowAfisha
Proof of concept for event recommendation system using machine learning
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import re
from collections import Counter
import math

class EventRecommendationSystem:
    """
    A simple recommendation system for events based on content filtering
    and basic collaborative filtering principles.
    """
    
    def __init__(self, events_file: str = "events.json"):
        """Initialize the recommendation system with events data."""
        self.events_file = events_file
        self.events_df = None
        self.user_profiles = {}
        self.event_features = {}
        self.load_events()
        self.extract_features()
    
    def load_events(self):
        """Load events from JSON file into pandas DataFrame."""
        try:
            with open(self.events_file, 'r', encoding='utf-8') as f:
                events_data = json.load(f)
            
            self.events_df = pd.DataFrame(events_data)
            self.events_df['date'] = pd.to_datetime(self.events_df['date'], errors='coerce')
            # Remove events with invalid dates
            self.events_df = self.events_df.dropna(subset=['date'])
            print(f"Loaded {len(self.events_df)} events")
            
        except FileNotFoundError:
            print(f"Events file {self.events_file} not found")
            self.events_df = pd.DataFrame()
    
    def extract_features(self):
        """Extract features from event titles and locations for content-based filtering."""
        if self.events_df.empty:
            return
        
        # Extract keywords from titles
        for idx, row in self.events_df.iterrows():
            title = row['title'].lower()
            location = row['location'].lower()
            
            # Simple keyword extraction
            keywords = self._extract_keywords(title)
            venue_type = self._classify_venue(location)
            event_type = self._classify_event_type(title)
            
            self.event_features[idx] = {
                'keywords': keywords,
                'venue_type': venue_type,
                'event_type': event_type,
                'date': row['date'],
                'location': location
            }
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from event title."""
        # Remove common words and extract meaningful terms
        stop_words = {'в', 'на', 'и', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'о', 'об'}
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [word for word in words if len(word) > 2 and word not in stop_words]
        return keywords
    
    def _classify_venue(self, location: str) -> str:
        """Classify venue type based on location text."""
        venue_keywords = {
            'club': ['клуб', 'club', 'место силы', 'barn'],
            'outdoor': ['пляж', 'парк', 'площадь', 'улица'],
            'cultural': ['театр', 'музей', 'галерея', 'дом культуры'],
            'bar_restaurant': ['бар', 'ресторан', 'кафе'],
            'educational': ['университет', 'кгту', 'институт'],
            'other': []
        }
        
        location_lower = location.lower()
        for venue_type, keywords in venue_keywords.items():
            if any(keyword in location_lower for keyword in keywords):
                return venue_type
        return 'other'
    
    def _classify_event_type(self, title: str) -> str:
        """Classify event type based on title keywords."""
        event_keywords = {
            'music': ['party', 'концерт', 'музыка', 'dj', 'диджей', 'stereo', 'electronic'],
            'cultural': ['выставка', 'театр', 'лекция', 'фестиваль'],
            'sports': ['спорт', 'футбол', 'волейбол', 'бег'],
            'food': ['пикник', 'food', 'еда'],
            'birthday': ['bday', 'birthday', 'день рождения'],
            'other': []
        }
        
        title_lower = title.lower()
        for event_type, keywords in event_keywords.items():
            if any(keyword in title_lower for keyword in keywords):
                return event_type
        return 'other'
    
    def create_user_profile(self, user_id: str, liked_events: List[int], 
                          disliked_events: List[int] = None) -> Dict[str, Any]:
        """Create a user profile based on liked/disliked events."""
        if disliked_events is None:
            disliked_events = []
        
        profile = {
            'preferred_keywords': Counter(),
            'preferred_venues': Counter(),
            'preferred_event_types': Counter(),
            'preferred_times': [],
            'liked_events': liked_events,
            'disliked_events': disliked_events
        }
        
        # Analyze liked events
        for event_idx in liked_events:
            if event_idx in self.event_features:
                features = self.event_features[event_idx]
                profile['preferred_keywords'].update(features['keywords'])
                profile['preferred_venues'][features['venue_type']] += 1
                profile['preferred_event_types'][features['event_type']] += 1
                profile['preferred_times'].append(features['date'])
        
        # Reduce weight for disliked events
        for event_idx in disliked_events:
            if event_idx in self.event_features:
                features = self.event_features[event_idx]
                for keyword in features['keywords']:
                    if keyword in profile['preferred_keywords']:
                        profile['preferred_keywords'][keyword] = max(0, 
                            profile['preferred_keywords'][keyword] - 1)
        
        self.user_profiles[user_id] = profile
        return profile
    
    def calculate_event_score(self, user_id: str, event_idx: int) -> float:
        """Calculate recommendation score for an event for a specific user."""
        if user_id not in self.user_profiles or event_idx not in self.event_features:
            return 0.0
        
        user_profile = self.user_profiles[user_id]
        event_features = self.event_features[event_idx]
        
        score = 0.0
        
        # Keyword similarity
        keyword_score = 0.0
        for keyword in event_features['keywords']:
            if keyword in user_profile['preferred_keywords']:
                keyword_score += user_profile['preferred_keywords'][keyword]
        
        # Normalize by total keywords
        if len(event_features['keywords']) > 0:
            keyword_score /= len(event_features['keywords'])
        
        # Venue type preference
        venue_score = user_profile['preferred_venues'].get(
            event_features['venue_type'], 0) / max(1, sum(user_profile['preferred_venues'].values()))
        
        # Event type preference
        event_type_score = user_profile['preferred_event_types'].get(
            event_features['event_type'], 0) / max(1, sum(user_profile['preferred_event_types'].values()))
        
        # Time preference (prefer events in similar time periods)
        time_score = self._calculate_time_preference(user_profile, event_features['date'])
        
        # Combine scores with weights
        score = (keyword_score * 0.4 + 
                venue_score * 0.2 + 
                event_type_score * 0.2 + 
                time_score * 0.2)
        
        return score
    
    def _calculate_time_preference(self, user_profile: Dict, event_date: datetime) -> float:
        """Calculate time preference score based on user's historical preferences."""
        if not user_profile['preferred_times']:
            return 0.5  # Neutral score if no time preferences
        
        # Calculate average preferred day of week and hour
        preferred_weekdays = [dt.weekday() for dt in user_profile['preferred_times']]
        preferred_hours = [dt.hour for dt in user_profile['preferred_times']]
        
        # Simple scoring based on day of week similarity
        event_weekday = event_date.weekday()
        weekday_score = 1.0 if event_weekday in preferred_weekdays else 0.3
        
        return weekday_score
    
    def recommend_events(self, user_id: str, num_recommendations: int = 10, 
                        days_ahead: int = 30) -> List[Tuple[int, float, Dict]]:
        """Recommend events for a user."""
        if user_id not in self.user_profiles:
            return []
        
        # Filter future events
        current_date = datetime.now()
        future_date = current_date + timedelta(days=days_ahead)
        
        future_events = self.events_df[
            (self.events_df['date'] >= current_date) & 
            (self.events_df['date'] <= future_date)
        ]
        
        # Calculate scores for all future events
        recommendations = []
        for idx in future_events.index:
            if idx not in self.user_profiles[user_id]['liked_events']:  # Don't recommend already liked events
                score = self.calculate_event_score(user_id, idx)
                event_data = self.events_df.loc[idx].to_dict()
                recommendations.append((idx, score, event_data))
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:num_recommendations]
    
    def get_popular_events(self, days_ahead: int = 7) -> List[Dict]:
        """Get popular events based on simple heuristics."""
        current_date = datetime.now()
        future_date = current_date + timedelta(days=days_ahead)
        
        future_events = self.events_df[
            (self.events_df['date'] >= current_date) & 
            (self.events_df['date'] <= future_date)
        ]
        
        # Simple popularity scoring based on venue and event type
        popular_venues = ['место силы', 'форма', 'barn']
        popular_types = ['party', 'концерт', 'festival']
        
        scored_events = []
        for idx, event in future_events.iterrows():
            score = 0
            title_lower = event['title'].lower()
            location_lower = event['location'].lower()
            
            # Venue popularity
            for venue in popular_venues:
                if venue in location_lower:
                    score += 2
            
            # Event type popularity
            for event_type in popular_types:
                if event_type in title_lower:
                    score += 1
            
            # Weekend bonus
            if event['date'].weekday() >= 5:  # Saturday or Sunday
                score += 1
            
            event_dict = event.to_dict()
            event_dict['popularity_score'] = score
            scored_events.append(event_dict)
        
        # Sort by popularity score
        scored_events.sort(key=lambda x: x['popularity_score'], reverse=True)
        return scored_events[:10]

def demo_recommendation_system():
    """Demonstrate the recommendation system functionality."""
    print("=== MeowAfisha AI Recommendation System Demo ===\n")
    
    # Initialize the system
    rec_system = EventRecommendationSystem()
    
    if rec_system.events_df.empty:
        print("No events data available for demonstration.")
        return
    
    print(f"Loaded {len(rec_system.events_df)} events")
    print(f"Extracted features for {len(rec_system.event_features)} events\n")
    
    # Show some event features
    print("Sample event features:")
    for i, (idx, features) in enumerate(list(rec_system.event_features.items())[:3]):
        event = rec_system.events_df.loc[idx]
        print(f"Event: {event['title']}")
        print(f"  Keywords: {features['keywords']}")
        print(f"  Venue type: {features['venue_type']}")
        print(f"  Event type: {features['event_type']}")
        print()
    
    # Create a sample user profile
    # Simulate a user who likes music events and parties
    sample_liked_events = []
    for idx, event in rec_system.events_df.iterrows():
        title_lower = event['title'].lower()
        if any(keyword in title_lower for keyword in ['party', 'music', 'dj', 'stereo']):
            sample_liked_events.append(idx)
            if len(sample_liked_events) >= 3:
                break
    
    if sample_liked_events:
        print("Creating user profile based on liked events:")
        for event_idx in sample_liked_events:
            event = rec_system.events_df.loc[event_idx]
            print(f"  - {event['title']}")
        print()
        
        user_profile = rec_system.create_user_profile("demo_user", sample_liked_events)
        
        print("User preferences:")
        print(f"  Top keywords: {dict(user_profile['preferred_keywords'].most_common(5))}")
        print(f"  Preferred venues: {dict(user_profile['preferred_venues'])}")
        print(f"  Preferred event types: {dict(user_profile['preferred_event_types'])}")
        print()
        
        # Get recommendations
        recommendations = rec_system.recommend_events("demo_user", num_recommendations=5)
        
        print("Top 5 recommendations:")
        for i, (event_idx, score, event_data) in enumerate(recommendations, 1):
            print(f"{i}. {event_data['title']} (Score: {score:.3f})")
            print(f"   Date: {event_data['date']}")
            print(f"   Location: {event_data['location']}")
            print()
    
    # Show popular events
    popular_events = rec_system.get_popular_events()
    print("Popular events (next 7 days):")
    for i, event in enumerate(popular_events[:5], 1):
        print(f"{i}. {event['title']} (Popularity: {event['popularity_score']})")
        print(f"   Date: {event['date']}")
        print(f"   Location: {event['location']}")
        print()

if __name__ == "__main__":
    demo_recommendation_system()

