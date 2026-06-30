from clients.bm25.bm25_client import Bm25Client
from clients.embedding.embedding_client import EmbeddingClient
from clients.milvus.milvus_client import get_milvus_client
from clients.redis.redis_client import get_redis_client
from clients.reranker.reranker_client import RerankerClient
from core.config import settings
from dependency_injector import containers, providers
from repositories.vector_search.vector_search_milvus_repository import VectorSearchMilvusRepository
from services.vector_search.vector_search_service import VectorSearchService


class Container(containers.DeclarativeContainer):
    # Config
    config = providers.Object(settings)

    # Client (외부 연결 — Milvus/Redis 는 외부타입 get_* 팩토리, 임베딩/리랭커/BM25 는 우리 클래스)
    milvus_client = providers.Singleton(get_milvus_client, config)
    redis_client = providers.Singleton(get_redis_client, config)
    embedding_client = providers.Singleton(EmbeddingClient, config)
    reranker_client = providers.Singleton(RerankerClient, config)
    bm25_client = providers.Singleton(Bm25Client, redis_client=redis_client)

    # Repository (Milvus = 벡터 store, 연결 주입)
    vector_search_milvus_repository = providers.Factory(VectorSearchMilvusRepository, milvus_client=milvus_client)

    # Service (repository + client 주입). use_real_api=false 면 MOCK 금융 문서로 폴백 (인프라 없이 단독 동작)
    vector_search_service = providers.Factory(
        VectorSearchService,
        vector_search_repository=vector_search_milvus_repository,
        embedding_client=embedding_client,
        reranker_client=reranker_client,
        bm25_client=bm25_client,
        use_real_api=config.provided.USE_REAL_API,
    )

    router_modules = ["routers.vector_search.vector_search_router"]
    wiring_config = containers.WiringConfiguration(modules=router_modules)
