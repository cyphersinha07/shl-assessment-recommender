import json
import os
import numpy as np
from app.config import logger, CATALOG_PATH

# Safe imports for FAISS and sentence-transformers
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    HAS_REAL_FAISS = True
except ImportError:
    HAS_REAL_FAISS = False
    logger.warning("FAISS or sentence-transformers not available. Falling back to semantic TF-IDF/Keyword vector search.")

class SHLVectorDatabase:
    def __init__(self):
        self.catalog = []
        self.load_catalog()
        
        if HAS_REAL_FAISS:
            try:
                # Load standard lightweight embedding model
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
                self.index = None
                self.build_index()
            except Exception as e:
                logger.error(f"Error initializing SentenceTransformer/FAISS: {e}. Falling back.")
                self.has_real_faiss = False
                self._init_fallback()
            else:
                self.has_real_faiss = True
        else:
            self.has_real_faiss = False
            self._init_fallback()

    def load_catalog(self):
        """Loads product catalog from local JSON storage."""
        if os.path.exists(CATALOG_PATH):
            with open(CATALOG_PATH, "r") as f:
                self.catalog = json.load(f)
        else:
            # Fallback inline catalog just in case file is absent
            self.catalog = [
                {
                    "id": "opq32",
                    "name": "Occupational Personality Questionnaire (OPQ32)",
                    "url": "https://www.shl.com/solutions/products/occupational-personality-questionnaire/",
                    "test_type": "P",
                    "description": "Occupational Personality Questionnaire (OPQ32) is the premier global assessment of workplace personality and behavior style. Grouped into Relationship with People, Thinking Style, and Feelings and Emotions.",
                    "keywords": ["personality", "behavior", "traits", "workplace style", "leadership"]
                },
                {
                    "id": "verify_g_plus",
                    "name": "Verify G+ (General Ability)",
                    "url": "https://www.shl.com/solutions/products/verify-gplus-general-ability-test/",
                    "test_type": "K",
                    "description": "Verify G+ measures general cognitive ability by combining Numerical Reasoning, Deductive Reasoning, and Inductive Reasoning into a single assessment of mental agility.",
                    "keywords": ["cognitive ability", "general ability", "numerical reasoning", "deductive", "inductive", "mental agility"]
                }
            ]
        logger.info(f"Loaded {len(self.catalog)} items into vector database context.")

    def build_index(self):
        """Builds FAISS index using SentenceTransformer embeddings."""
        texts = []
        for item in self.catalog:
            # Combine fields to build rich documents for embedding
            text_context = f"Product: {item['name']}. Type: {item['test_type']}. Description: {item['description']}. Keywords: {', '.join(item.get('keywords', []))}"
            texts.append(text_context)
            
        embeddings = self.model.encode(texts)
        embeddings = np.array(embeddings).astype("float32")
        
        # Dimension size of all-MiniLM-L6-v2 embeddings is 384
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product (Cosine Similarity if normalized)
        
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        logger.info("Successfully built FAISS index with normalized embeddings.")

    def _init_fallback(self):
        """Prepares a simple but highly effective TF-IDF and keyword matching system."""
        logger.info("Initializing fallback keyword vector database...")
        self.corpus_terms = []
        for item in self.catalog:
            # Normalize terms
            terms = set(
                (item["name"] + " " + item["description"] + " " + " ".join(item.get("keywords", []))).lower().split()
            )
            self.corpus_terms.append(terms)

    def search(self, query: str, k: int = 5) -> list:
        """
        Searches the database for the top K matching assessments.
        Returns a list of catalog objects.
        """
        if not self.catalog:
            return []
            
        k = min(k, len(self.catalog))
        
        if self.has_real_faiss:
            try:
                query_vector = self.model.encode([query])
                query_vector = np.array(query_vector).astype("float32")
                faiss.normalize_L2(query_vector)
                
                distances, indices = self.index.search(query_vector, k)
                results = []
                for idx in indices[0]:
                    if idx >= 0 and idx < len(self.catalog):
                        results.append(self.catalog[idx])
                return results
            except Exception as e:
                logger.error(f"FAISS search failed, falling back: {e}")
                
        # Fallback keyword ranking (Jaccard-like or term frequency similarity)
        query_terms = set(query.lower().split())
        scores = []
        for idx, document_terms in enumerate(self.corpus_terms):
            intersection = query_terms.intersection(document_terms)
            # Add weight for exact title matches
            title_matches = set(self.catalog[idx]["name"].lower().split()).intersection(query_terms)
            score = len(intersection) / (len(query_terms.union(document_terms)) or 1.0)
            score += len(title_matches) * 0.5 # boost title matches
            scores.append((score, idx))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        top_k_indices = [idx for _, idx in scores[:k]]
        return [self.catalog[idx] for idx in top_k_indices]

# Singleton vector DB instance
db = SHLVectorDatabase()
