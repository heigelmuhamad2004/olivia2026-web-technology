from .provinsi import Provinsi          # Tidak bergantung pada tabel lain
from .kabupaten import Kabupaten        # Bergantung pada Provinsi
from .kecamatan import Kecamatan        # Bergantung pada Kabupaten
from .user import User                  # Bergantung pada Kecamatan
from .pasien import Pasien              # Bergantung pada User & Kecamatan
from .skrining import Skrining          # Bergantung pada User & Pasien
from .token_block_list import TokenBlocklist  # Tidak bergantung pada tabel lain
from .rujukan import Rujukan