// Bộ từ vựng theo chủ đề cho Word Runners.
// Mỗi từ: [tiếng Anh, tiếng Việt, hình (emoji hoặc ký hiệu)]
// Thêm chủ đề mới: chép một khối { id, en, vi, icon, color, words } và điền từ.
window.TOPICS = [
  { id: "fruits", en: "Fruits", vi: "Trái cây", icon: "🍎", color: "#E8463A", words: [
    ["apple", "quả táo", "🍎"], ["banana", "quả chuối", "🍌"], ["orange", "quả cam", "🍊"],
    ["grape", "quả nho", "🍇"], ["strawberry", "quả dâu tây", "🍓"], ["watermelon", "quả dưa hấu", "🍉"],
    ["lemon", "quả chanh", "🍋"], ["pear", "quả lê", "🍐"], ["mango", "quả xoài", "🥭"],
    ["pineapple", "quả dứa", "🍍"], ["cherry", "quả anh đào", "🍒"], ["coconut", "quả dừa", "🥥"],
    ["peach", "quả đào", "🍑"], ["kiwi", "quả kiwi", "🥝"]
  ]},
  { id: "animals", en: "Animals", vi: "Con vật", icon: "🐶", color: "#B9772F", words: [
    ["dog", "con chó", "🐶"], ["cat", "con mèo", "🐱"], ["bird", "con chim", "🐦"],
    ["fish", "con cá", "🐟"], ["cow", "con bò", "🐄"], ["pig", "con lợn", "🐷"],
    ["duck", "con vịt", "🦆"], ["chicken", "con gà", "🐔"], ["horse", "con ngựa", "🐴"],
    ["rabbit", "con thỏ", "🐰"], ["mouse", "con chuột", "🐭"], ["frog", "con ếch", "🐸"],
    ["sheep", "con cừu", "🐑"], ["goat", "con dê", "🐐"]
  ]},
  { id: "wild", en: "Wild animals", vi: "Thú hoang dã", icon: "🦁", color: "#D98A00", words: [
    ["lion", "con sư tử", "🦁"], ["tiger", "con hổ", "🐯"], ["elephant", "con voi", "🐘"],
    ["monkey", "con khỉ", "🐒"], ["bear", "con gấu", "🐻"], ["zebra", "con ngựa vằn", "🦓"],
    ["giraffe", "con hươu cao cổ", "🦒"], ["snake", "con rắn", "🐍"], ["fox", "con cáo", "🦊"],
    ["panda", "con gấu trúc", "🐼"], ["kangaroo", "con chuột túi", "🦘"], ["crocodile", "con cá sấu", "🐊"]
  ]},
  { id: "ocean", en: "Sea animals", vi: "Sinh vật biển", icon: "🐳", color: "#2560CC", words: [
    ["whale", "con cá voi", "🐳"], ["shark", "con cá mập", "🦈"], ["dolphin", "con cá heo", "🐬"],
    ["octopus", "con bạch tuộc", "🐙"], ["crab", "con cua", "🦀"], ["turtle", "con rùa", "🐢"],
    ["jellyfish", "con sứa", "🪼"], ["shrimp", "con tôm", "🦐"], ["seal", "con hải cẩu", "🦭"],
    ["squid", "con mực", "🦑"], ["shell", "vỏ sò", "🐚"], ["penguin", "chim cánh cụt", "🐧"]
  ]},
  { id: "insects", en: "Bugs", vi: "Côn trùng", icon: "🐝", color: "#C99700", words: [
    ["bee", "con ong", "🐝"], ["ant", "con kiến", "🐜"], ["butterfly", "con bướm", "🦋"],
    ["ladybug", "con bọ rùa", "🐞"], ["spider", "con nhện", "🕷️"], ["snail", "con ốc sên", "🐌"],
    ["worm", "con sâu", "🪱"], ["fly", "con ruồi", "🪰"], ["mosquito", "con muỗi", "🦟"],
    ["cricket", "con dế", "🦗"], ["beetle", "con bọ cánh cứng", "🪲"], ["caterpillar", "con sâu bướm", "🐛"]
  ]},
  { id: "colors", en: "Colors", vi: "Màu sắc", icon: "🎨", color: "#7C4DDB", words: [
    ["red", "màu đỏ", "🔴"], ["blue", "màu xanh dương", "🔵"], ["yellow", "màu vàng", "🟡"],
    ["green", "màu xanh lá", "🟢"], ["orange", "màu cam", "🟠"], ["purple", "màu tím", "🟣"],
    ["brown", "màu nâu", "🟤"], ["black", "màu đen", "⚫"], ["white", "màu trắng", "⚪"],
    ["pink", "màu hồng", "🩷"], ["gray", "màu xám", "🩶"]
  ]},
  { id: "numbers", en: "Numbers", vi: "Con số", icon: "🔢", color: "#13804A", words: [
    ["one", "số một", "1"], ["two", "số hai", "2"], ["three", "số ba", "3"], ["four", "số bốn", "4"],
    ["five", "số năm", "5"], ["six", "số sáu", "6"], ["seven", "số bảy", "7"], ["eight", "số tám", "8"],
    ["nine", "số chín", "9"], ["ten", "số mười", "10"], ["eleven", "số mười một", "11"], ["twelve", "số mười hai", "12"],
    ["twenty", "số hai mươi", "20"], ["hundred", "một trăm", "100"]
  ]},
  { id: "shapes", en: "Shapes", vi: "Hình khối", icon: "🔷", color: "#2560CC", words: [
    ["circle", "hình tròn", "⬤"], ["square", "hình vuông", "■"], ["triangle", "hình tam giác", "▲"],
    ["star", "ngôi sao", "★"], ["heart", "hình trái tim", "♥"], ["diamond", "hình thoi", "◆"],
    ["rectangle", "hình chữ nhật", "▬"], ["oval", "hình bầu dục", "⬮"], ["cross", "dấu cộng", "✚"],
    ["arrow", "mũi tên", "➜"]
  ]},
  { id: "body", en: "My body", vi: "Cơ thể", icon: "🖐️", color: "#E8590C", words: [
    ["eye", "con mắt", "👁️"], ["ear", "cái tai", "👂"], ["nose", "cái mũi", "👃"], ["mouth", "cái miệng", "👄"],
    ["hand", "bàn tay", "✋"], ["foot", "bàn chân", "🦶"], ["leg", "cái chân", "🦵"], ["arm", "cánh tay", "💪"],
    ["tooth", "cái răng", "🦷"], ["hair", "mái tóc", "💇"], ["finger", "ngón tay", "☝️"], ["face", "khuôn mặt", "🙂"],
    ["tongue", "cái lưỡi", "👅"], ["brain", "bộ não", "🧠"]
  ]},
  { id: "family", en: "Family", vi: "Gia đình", icon: "👪", color: "#D6336C", words: [
    ["mother", "mẹ", "👩"], ["father", "bố", "👨"], ["baby", "em bé", "👶"], ["sister", "chị gái, em gái", "👧"],
    ["brother", "anh trai, em trai", "👦"], ["grandma", "bà", "👵"], ["grandpa", "ông", "👴"], ["family", "gia đình", "👪"],
    ["friend", "bạn bè", "🧑‍🤝‍🧑"], ["boy", "con trai", "🧒"], ["girl", "con gái", "👧"], ["teacher", "cô giáo, thầy giáo", "🧑‍🏫"]
  ]},
  { id: "food", en: "Food & drinks", vi: "Đồ ăn, thức uống", icon: "🍕", color: "#E8590C", words: [
    ["bread", "bánh mì", "🍞"], ["rice", "cơm", "🍚"], ["egg", "quả trứng", "🥚"], ["milk", "sữa", "🥛"],
    ["water", "nước", "💧"], ["cake", "bánh ngọt", "🍰"], ["pizza", "bánh pizza", "🍕"], ["cheese", "phô mai", "🧀"],
    ["noodles", "mì sợi", "🍜"], ["juice", "nước ép", "🧃"], ["candy", "kẹo", "🍬"], ["ice cream", "kem", "🍦"],
    ["chicken", "thịt gà", "🍗"], ["soup", "món canh", "🍲"], ["cookie", "bánh quy", "🍪"], ["carrot", "cà rốt", "🥕"]
  ]},
  { id: "vegetables", en: "Vegetables", vi: "Rau củ", icon: "🥕", color: "#13804A", words: [
    ["carrot", "củ cà rốt", "🥕"], ["corn", "bắp ngô", "🌽"], ["potato", "củ khoai tây", "🥔"], ["tomato", "quả cà chua", "🍅"],
    ["onion", "củ hành", "🧅"], ["garlic", "củ tỏi", "🧄"], ["cucumber", "quả dưa chuột", "🥒"], ["pepper", "quả ớt chuông", "🫑"],
    ["mushroom", "cây nấm", "🍄"], ["broccoli", "súp lơ xanh", "🥦"], ["peas", "đậu Hà Lan", "🫛"], ["eggplant", "quả cà tím", "🍆"]
  ]},
  { id: "school", en: "School", vi: "Trường học", icon: "🎒", color: "#2560CC", words: [
    ["book", "quyển sách", "📖"], ["pen", "cái bút mực", "🖊️"], ["pencil", "bút chì", "✏️"], ["ruler", "thước kẻ", "📏"],
    ["bag", "cặp sách", "🎒"], ["scissors", "cái kéo", "✂️"], ["crayon", "bút sáp màu", "🖍️"], ["paper", "tờ giấy", "📄"],
    ["computer", "máy tính", "💻"], ["clock", "đồng hồ", "🕐"], ["notebook", "quyển vở", "📓"], ["school", "trường học", "🏫"]
  ]},
  { id: "home", en: "My home", vi: "Ngôi nhà", icon: "🏠", color: "#B9772F", words: [
    ["house", "ngôi nhà", "🏠"], ["door", "cửa ra vào", "🚪"], ["bed", "cái giường", "🛏️"], ["chair", "cái ghế", "🪑"],
    ["window", "cửa sổ", "🪟"], ["lamp", "cái đèn", "💡"], ["sofa", "ghế sô pha", "🛋️"], ["bath", "bồn tắm", "🛁"],
    ["key", "chìa khóa", "🔑"], ["phone", "điện thoại", "📱"], ["television", "ti vi", "📺"], ["cup", "cái cốc", "☕"]
  ]},
  { id: "clothes", en: "Clothes", vi: "Quần áo", icon: "👕", color: "#7C4DDB", words: [
    ["shirt", "áo sơ mi", "👕"], ["dress", "váy liền", "👗"], ["hat", "cái mũ", "🎩"], ["cap", "mũ lưỡi trai", "🧢"],
    ["shoes", "đôi giày", "👟"], ["socks", "đôi tất", "🧦"], ["jeans", "quần bò", "👖"], ["coat", "áo khoác", "🧥"],
    ["glasses", "kính mắt", "👓"], ["scarf", "khăn quàng", "🧣"], ["gloves", "găng tay", "🧤"], ["boots", "đôi ủng", "👢"]
  ]},
  { id: "toys", en: "Toys", vi: "Đồ chơi", icon: "🧸", color: "#D6336C", words: [
    ["ball", "quả bóng", "⚽"], ["doll", "búp bê", "🪆"], ["kite", "con diều", "🪁"], ["robot", "người máy", "🤖"],
    ["teddy bear", "gấu bông", "🧸"], ["yo-yo", "con quay yo-yo", "🪀"], ["puzzle", "trò xếp hình", "🧩"], ["balloon", "bóng bay", "🎈"],
    ["drum", "cái trống", "🥁"], ["blocks", "khối xếp hình", "🧱"], ["guitar", "đàn ghi-ta", "🎸"], ["train", "tàu hỏa đồ chơi", "🚂"]
  ]},
  { id: "transport", en: "Transport", vi: "Phương tiện", icon: "🚗", color: "#2560CC", words: [
    ["car", "ô tô", "🚗"], ["bus", "xe buýt", "🚌"], ["bike", "xe đạp", "🚲"], ["train", "tàu hỏa", "🚆"],
    ["plane", "máy bay", "✈️"], ["boat", "con thuyền", "⛵"], ["ship", "con tàu", "🚢"], ["truck", "xe tải", "🚚"],
    ["taxi", "xe taxi", "🚕"], ["motorbike", "xe máy", "🏍️"], ["helicopter", "trực thăng", "🚁"], ["rocket", "tên lửa", "🚀"]
  ]},
  { id: "nature", en: "Weather & nature", vi: "Thời tiết, thiên nhiên", icon: "🌈", color: "#13804A", words: [
    ["sun", "mặt trời", "☀️"], ["moon", "mặt trăng", "🌙"], ["star", "ngôi sao", "⭐"], ["cloud", "đám mây", "☁️"],
    ["rain", "mưa", "🌧️"], ["snow", "tuyết", "❄️"], ["wind", "gió", "🌬️"], ["tree", "cái cây", "🌳"],
    ["flower", "bông hoa", "🌸"], ["rainbow", "cầu vồng", "🌈"], ["sea", "biển", "🌊"], ["mountain", "ngọn núi", "⛰️"],
    ["fire", "ngọn lửa", "🔥"], ["leaf", "chiếc lá", "🍃"]
  ]},
  { id: "jobs", en: "Jobs", vi: "Nghề nghiệp", icon: "🧑‍🚒", color: "#E8590C", words: [
    ["doctor", "bác sĩ", "🧑‍⚕️"], ["teacher", "giáo viên", "🧑‍🏫"], ["farmer", "nông dân", "🧑‍🌾"], ["cook", "đầu bếp", "🧑‍🍳"],
    ["police", "cảnh sát", "👮"], ["firefighter", "lính cứu hỏa", "🧑‍🚒"], ["pilot", "phi công", "🧑‍✈️"], ["singer", "ca sĩ", "🧑‍🎤"],
    ["artist", "họa sĩ", "🧑‍🎨"], ["builder", "thợ xây", "👷"], ["astronaut", "phi hành gia", "🧑‍🚀"], ["scientist", "nhà khoa học", "🧑‍🔬"]
  ]},
  { id: "actions", en: "Actions", vi: "Hành động", icon: "🏃", color: "#7C4DDB", words: [
    ["run", "chạy", "🏃"], ["swim", "bơi", "🏊"], ["dance", "nhảy múa", "💃"], ["sing", "hát", "🎤"],
    ["read", "đọc", "📖"], ["write", "viết", "✍️"], ["sleep", "ngủ", "😴"], ["eat", "ăn", "🍽️"],
    ["drink", "uống", "🥤"], ["climb", "leo trèo", "🧗"], ["ride", "đạp xe", "🚴"], ["paint", "vẽ tranh", "🎨"],
    ["wave", "vẫy tay", "👋"], ["clap", "vỗ tay", "👏"]
  ]},
  { id: "feelings", en: "Feelings", vi: "Cảm xúc", icon: "😊", color: "#C99700", words: [
    ["happy", "vui vẻ", "😊"], ["sad", "buồn", "😢"], ["angry", "tức giận", "😠"], ["scared", "sợ hãi", "😨"],
    ["tired", "mệt mỏi", "😫"], ["surprised", "ngạc nhiên", "😮"], ["sleepy", "buồn ngủ", "🥱"], ["sick", "bị ốm", "🤒"],
    ["hungry", "đói bụng", "🤤"], ["cold", "lạnh", "🥶"], ["hot", "nóng", "🥵"], ["love", "yêu thương", "🥰"]
  ]},
  { id: "directions", en: "Directions", vi: "Phương hướng", icon: "🧭", color: "#1D2B53", words: [
    ["left", "bên trái", "⬅️"], ["right", "bên phải", "➡️"], ["up", "lên trên", "⬆️"], ["down", "xuống dưới", "⬇️"],
    ["stop", "dừng lại", "🛑"], ["go", "đi tiếp", "🟢"], ["in", "ở trong", "📥"], ["out", "ra ngoài", "📤"],
    ["back", "quay lại", "🔙"], ["top", "trên đỉnh", "🔝"], ["turn", "rẽ, quay", "🔄"], ["jump", "nhảy lên", "🦘"]
  ]}
];
