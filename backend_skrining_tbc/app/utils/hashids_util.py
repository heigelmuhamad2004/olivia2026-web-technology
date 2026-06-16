from hashids import Hashids

# Salt harus sama antara backend & frontend
hashids = Hashids(salt="tbc-secret-salt-2026", min_length=8)

def encode_id(id):
    return hashids.encode(id)

def decode_id(hash_id):
    decoded = hashids.decode(hash_id)
    return decoded[0] if decoded else None