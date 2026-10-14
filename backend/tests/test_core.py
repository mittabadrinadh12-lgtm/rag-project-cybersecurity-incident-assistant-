from app.services.knowledge import LocalHashEmbedding, chunks, retrieve
from app.services.mitre import for_incident


def test_embedding_is_deterministic_and_normalized():
    first = LocalHashEmbedding()(["defensive incident response"])[0]
    second = LocalHashEmbedding()(["defensive incident response"])[0]
    assert list(first) == list(second)
    assert len(first) == 384
    assert 0.99 < sum(value * value for value in first) ** 0.5 < 1.01


def test_chunking_covers_long_text():
    text = "defensive guidance " * 200
    result = chunks(text, size=150, overlap=20)
    assert len(result) > 1
    assert all(result)
    assert result[0][:100] in text


def test_subtechnique_maps_to_parent_technique():
    assert for_incident("T1059.001")[0]["id"] == "T1059"


def test_retrieval_is_empty_before_knowledge_initialization():
    assert retrieve("") == []
