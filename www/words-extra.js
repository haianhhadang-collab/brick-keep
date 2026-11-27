// Brick Keep: từ bổ sung cho từng chủ đề (nạp sau words.js).
// words.js là bộ từ chung với Word Runners nên không sửa ở đó; tệp này chỉ thêm từ cho bảng chữ của Brick Keep.
// Mỗi từ: [tiếng Anh (chỉ chữ thường, không dấu cách), tiếng Việt, hình].
// Độ khó tính theo độ dài từ: màn đầu dùng từ 3–4 chữ, màn cuối dùng từ 5–9 chữ (xem D.boardSpec trong data.js).
(function () {
  "use strict";
  var EXTRA = {
    fruits: [
      ["fruit", "hoa quả, trái cây", "🍏"], ["seed", "hạt giống", "🌱"], ["melon", "quả dưa lưới", "🍈"],
      ["olive", "quả ô liu", "🫒"], ["peanut", "hạt lạc", "🥜"], ["avocado", "quả bơ", "🥑"],
      ["chestnut", "hạt dẻ", "🌰"], ["blueberry", "quả việt quất", "🫐"]
    ],
    animals: [
      ["owl", "con cú", "🦉"], ["bat", "con dơi", "🦇"], ["rat", "con chuột cống", "🐀"], ["pet", "thú cưng", "🐾"],
      ["deer", "con hươu", "🦌"], ["swan", "con thiên nga", "🦢"], ["bull", "con bò đực", "🐂"], ["chick", "con gà con", "🐥"],
      ["puppy", "con chó con", "🐕"], ["camel", "con lạc đà", "🐫"], ["kitten", "con mèo con", "🐈"], ["turkey", "con gà tây", "🦃"],
      ["parrot", "con vẹt", "🦜"], ["rooster", "con gà trống", "🐓"], ["hamster", "con chuột hamster", "🐹"], ["peacock", "con công", "🦚"]
    ],
    wild: [
      ["ape", "con vượn", "🦧"], ["wolf", "con chó sói", "🐺"], ["boar", "con lợn rừng", "🐗"], ["hippo", "con hà mã", "🦛"],
      ["rhino", "con tê giác", "🦏"], ["koala", "con gấu túi", "🐨"], ["sloth", "con lười", "🦥"], ["otter", "con rái cá", "🦦"],
      ["eagle", "con đại bàng", "🦅"], ["skunk", "con chồn hôi", "🦨"], ["lizard", "con thằn lằn", "🦎"], ["badger", "con lửng", "🦡"],
      ["gorilla", "con khỉ đột", "🦍"], ["leopard", "con báo", "🐆"], ["buffalo", "con trâu", "🐃"], ["raccoon", "con gấu mèo", "🦝"],
      ["squirrel", "con sóc", "🐿️"], ["hedgehog", "con nhím", "🦔"]
    ],
    ocean: [
      ["fish", "con cá", "🐠"], ["net", "cái lưới", "🥅"], ["sand", "cát", "🏖️"], ["wave", "con sóng", "🌊"],
      ["coral", "san hô", "🪸"], ["island", "hòn đảo", "🏝️"], ["lobster", "con tôm hùm", "🦞"], ["oyster", "con hàu", "🦪"],
      ["starfish", "con sao biển", "⭐"], ["seaweed", "rong biển", "🌿"], ["blowfish", "con cá nóc", "🐡"]
    ],
    insects: [
      ["web", "mạng nhện", "🕸️"], ["leaf", "chiếc lá", "🍃"], ["honey", "mật ong", "🍯"], ["flower", "bông hoa", "🌼"],
      ["garden", "khu vườn", "🏡"], ["firefly", "con đom đóm", "✨"], ["scorpion", "con bọ cạp", "🦂"], ["cockroach", "con gián", "🪳"]
    ],
    colors: [
      ["gold", "màu vàng kim", "🥇"], ["dark", "tối", "🌑"], ["light", "sáng", "💡"], ["paint", "màu vẽ", "🎨"],
      ["brush", "cọ vẽ", "🖌️"], ["silver", "màu bạc", "🥈"], ["crayon", "bút sáp màu", "🖍️"], ["bright", "sáng rực", "✨"],
      ["rainbow", "cầu vồng", "🌈"]
    ],
    numbers: [
      ["zero", "số không", "0"], ["first", "thứ nhất", "1st"], ["third", "thứ ba", "3rd"], ["second", "thứ hai", "2nd"],
      ["number", "con số", "🔢"], ["thirty", "số ba mươi", "30"], ["forty", "số bốn mươi", "40"], ["fifty", "số năm mươi", "50"],
      ["sixty", "số sáu mươi", "60"], ["eighty", "số tám mươi", "80"], ["ninety", "số chín mươi", "90"],
      ["thirteen", "số mười ba", "13"], ["fifteen", "số mười lăm", "15"], ["sixteen", "số mười sáu", "16"]
    ],
    shapes: [
      ["dot", "dấu chấm", "•"], ["box", "cái hộp", "📦"], ["line", "đường thẳng", "➖"], ["cube", "khối lập phương", "🧊"],
      ["ring", "vòng tròn, chiếc nhẫn", "💍"], ["cone", "hình nón", "🍦"], ["shape", "hình dạng", "🔶"], ["sphere", "khối cầu", "🔮"],
      ["spiral", "hình xoắn ốc", "🌀"], ["zigzag", "đường dích dắc", "⚡"], ["hexagon", "hình lục giác", "⬢"],
      ["pentagon", "hình ngũ giác", "⬟"], ["crescent", "hình lưỡi liềm", "🌙"]
    ],
    body: [
      ["toe", "ngón chân", "🦶"], ["head", "cái đầu", "👤"], ["neck", "cái cổ", "🧣"], ["lips", "đôi môi", "💋"],
      ["nail", "móng tay", "💅"], ["knee", "đầu gối", "🦵"], ["bone", "khúc xương", "🦴"], ["thumb", "ngón tay cái", "👍"],
      ["cheek", "cái má", "😊"], ["teeth", "hàm răng", "😁"], ["heart", "trái tim", "❤️"], ["beard", "bộ râu", "🧔"],
      ["shoulder", "đôi vai", "🤷"]
    ],
    family: [
      ["mom", "mẹ", "👩"], ["dad", "bố", "👨"], ["son", "con trai (của bố mẹ)", "👦"], ["kid", "đứa trẻ", "🧒"],
      ["man", "người đàn ông", "🧔"], ["aunt", "cô, dì", "👩‍🦰"], ["uncle", "chú, bác, cậu", "👨‍🦱"], ["woman", "người phụ nữ", "👱‍♀️"],
      ["child", "trẻ em", "🧒"], ["twins", "anh chị em sinh đôi", "👯"], ["cousin", "anh chị em họ", "🧑‍🤝‍🧑"],
      ["parents", "bố mẹ", "👫"], ["daughter", "con gái (của bố mẹ)", "👧"]
    ],
    food: [
      ["tea", "trà", "🍵"], ["pie", "bánh nướng", "🥧"], ["meat", "thịt", "🥩"], ["salt", "muối", "🧂"],
      ["honey", "mật ong", "🍯"], ["salad", "món rau trộn", "🥗"], ["pasta", "mì Ý", "🍝"], ["chips", "khoai tây chiên", "🍟"],
      ["bacon", "thịt xông khói", "🥓"], ["donut", "bánh vòng donut", "🍩"], ["lunch", "bữa trưa", "🍱"], ["burger", "bánh hamburger", "🍔"],
      ["butter", "bơ", "🧈"], ["coffee", "cà phê", "☕"], ["popcorn", "bỏng ngô", "🍿"], ["pancake", "bánh kếp", "🥞"],
      ["sandwich", "bánh mì kẹp", "🥪"]
    ],
    vegetables: [
      ["pea", "hạt đậu Hà Lan", "🫛"], ["bean", "hạt đậu", "🫘"], ["herb", "rau thơm", "🌿"], ["leaf", "lá rau", "🍃"],
      ["seed", "hạt giống", "🌱"], ["farm", "nông trại", "🚜"], ["chili", "quả ớt", "🌶️"], ["ginger", "củ gừng", "🫚"],
      ["pumpkin", "quả bí ngô", "🎃"], ["lettuce", "rau xà lách", "🥗"], ["cabbage", "bắp cải", "🥬"]
    ],
    school: [
      ["ink", "mực", "🖋️"], ["map", "bản đồ", "🗺️"], ["art", "môn vẽ", "🎨"], ["bell", "cái chuông", "🔔"],
      ["math", "môn toán", "➗"], ["glue", "keo dán", "🧴"], ["word", "từ", "💬"], ["clip", "cái kẹp giấy", "📎"],
      ["globe", "quả địa cầu", "🌍"], ["music", "âm nhạc", "🎵"], ["class", "lớp học", "🧑‍🏫"], ["eraser", "cục tẩy", "🧽"],
      ["lesson", "bài học", "📚"], ["letter", "chữ cái", "🔤"], ["student", "học sinh", "🧑‍🎓"], ["homework", "bài tập về nhà", "📝"]
    ],
    home: [
      ["pot", "cái nồi", "🍲"], ["wall", "bức tường", "🧱"], ["sink", "bồn rửa", "🚰"], ["soap", "xà phòng", "🧼"],
      ["bowl", "cái bát", "🥣"], ["fork", "cái dĩa", "🍴"], ["spoon", "cái thìa", "🥄"], ["broom", "cái chổi", "🧹"],
      ["table", "cái bàn", "🍽️"], ["mirror", "cái gương", "🪞"], ["fridge", "tủ lạnh", "🧊"], ["toilet", "nhà vệ sinh", "🚽"],
      ["basket", "cái giỏ", "🧺"], ["candle", "cây nến", "🕯️"], ["garden", "khu vườn", "🏡"], ["kitchen", "nhà bếp", "🍳"],
      ["stairs", "cầu thang", "🪜"]
    ],
    clothes: [
      ["tie", "cà vạt", "👔"], ["bag", "túi xách", "👜"], ["ring", "chiếc nhẫn", "💍"], ["purse", "cái ví", "👛"],
      ["crown", "vương miện", "👑"], ["watch", "đồng hồ đeo tay", "⌚"], ["shorts", "quần đùi", "🩳"], ["button", "cúc áo", "🔘"],
      ["helmet", "mũ bảo hiểm", "⛑️"], ["sandals", "dép xăng-đan", "👡"], ["sweater", "áo len", "🧶"], ["umbrella", "cái ô", "☂️"],
      ["swimsuit", "đồ bơi", "🩱"]
    ],
    toys: [
      ["toy", "đồ chơi", "🎠"], ["car", "ô tô đồ chơi", "🏎️"], ["card", "lá bài", "🃏"], ["dice", "xúc xắc", "🎲"],
      ["game", "trò chơi", "🎮"], ["gift", "món quà", "🎁"], ["mask", "mặt nạ", "🎭"], ["rope", "dây nhảy", "🪢"],
      ["teddy", "gấu bông", "🧸"], ["piano", "đàn piano", "🎹"], ["magic", "ảo thuật", "🪄"], ["bubble", "bong bóng xà phòng", "🫧"],
      ["violin", "đàn vi-ô-lông", "🎻"], ["scooter", "xe trượt scooter", "🛴"], ["trumpet", "kèn trumpet", "🎺"]
    ],
    transport: [
      ["van", "xe tải nhỏ", "🚐"], ["jet", "máy bay phản lực", "🛩️"], ["tram", "tàu điện", "🚋"], ["road", "con đường", "🛣️"],
      ["sled", "xe trượt tuyết", "🛷"], ["ferry", "phà", "⛴️"], ["canoe", "cái xuồng", "🛶"], ["wheel", "bánh xe", "🛞"],
      ["subway", "tàu điện ngầm", "🚇"], ["tractor", "máy kéo", "🚜"], ["airport", "sân bay", "🛫"], ["station", "nhà ga", "🚉"],
      ["ambulance", "xe cứu thương", "🚑"], ["firetruck", "xe cứu hỏa", "🚒"], ["parachute", "cái dù", "🪂"]
    ],
    nature: [
      ["sky", "bầu trời", "🌌"], ["ice", "băng", "🧊"], ["fog", "sương mù", "🌫️"], ["hill", "ngọn đồi", "🌄"],
      ["rock", "hòn đá", "🪨"], ["rose", "hoa hồng", "🌹"], ["grass", "cỏ", "🌱"], ["storm", "cơn bão", "⛈️"],
      ["earth", "trái đất", "🌍"], ["river", "dòng sông", "🏞️"], ["comet", "sao chổi", "☄️"], ["sunny", "trời nắng", "🌤️"],
      ["rainy", "trời mưa", "☔"], ["forest", "khu rừng", "🌲"], ["desert", "sa mạc", "🏜️"], ["planet", "hành tinh", "🪐"],
      ["cactus", "cây xương rồng", "🌵"], ["volcano", "núi lửa", "🌋"], ["thunder", "sấm sét", "🌩️"], ["tornado", "lốc xoáy", "🌪️"],
      ["sunflower", "hoa hướng dương", "🌻"]
    ],
    jobs: [
      ["vet", "bác sĩ thú y", "🩺"], ["king", "nhà vua", "🤴"], ["nurse", "y tá", "💉"], ["baker", "thợ làm bánh", "🥖"],
      ["queen", "nữ hoàng", "👸"], ["judge", "thẩm phán", "⚖️"], ["actor", "diễn viên", "🎬"], ["clown", "chú hề", "🤡"],
      ["guard", "người bảo vệ", "💂"], ["driver", "tài xế", "🚖"], ["sailor", "thủy thủ", "⚓"], ["writer", "nhà văn", "✍️"],
      ["dancer", "vũ công", "💃"], ["dentist", "nha sĩ", "🦷"], ["postman", "người đưa thư", "📮"], ["waiter", "người phục vụ bàn", "🍽️"],
      ["mechanic", "thợ sửa xe", "🔧"], ["fisherman", "ngư dân", "🎣"]
    ],
    actions: [
      ["sit", "ngồi", "🪑"], ["cry", "khóc", "😭"], ["hop", "nhảy lò cò", "🐇"], ["fly", "bay", "🕊️"],
      ["dig", "đào", "⛏️"], ["cut", "cắt", "✂️"], ["kick", "đá bóng", "⚽"], ["cook", "nấu ăn", "🍳"],
      ["walk", "đi bộ", "🚶"], ["play", "chơi", "🎮"], ["look", "nhìn", "👀"], ["talk", "nói chuyện", "🗣️"],
      ["draw", "vẽ", "✏️"], ["wash", "rửa", "🧼"], ["laugh", "cười to", "😂"], ["smile", "mỉm cười", "😃"],
      ["throw", "ném", "🤾"], ["catch", "bắt", "🧤"], ["build", "xây", "🏗️"], ["think", "suy nghĩ", "🤔"],
      ["skate", "trượt ván", "🛹"], ["shout", "hét to", "📢"], ["listen", "lắng nghe", "👂"]
    ],
    feelings: [
      ["shy", "ngại ngùng", "☺️"], ["mad", "tức điên", "😡"], ["joy", "niềm vui", "😄"], ["fine", "ổn", "👌"],
      ["calm", "bình tĩnh", "😌"], ["glad", "vui mừng", "😀"], ["kind", "tốt bụng", "🤗"], ["fear", "nỗi sợ", "😱"],
      ["bored", "chán", "😒"], ["proud", "tự hào", "😎"], ["brave", "dũng cảm", "🦁"], ["silly", "ngớ ngẩn", "🤪"],
      ["funny", "buồn cười", "😆"], ["upset", "buồn bực", "😞"], ["lonely", "cô đơn", "😔"], ["grumpy", "cáu kỉnh", "😤"],
      ["worried", "lo lắng", "😟"], ["excited", "háo hức", "🤩"], ["thirsty", "khát nước", "🥤"], ["nervous", "hồi hộp", "😬"]
    ],
    directions: [
      ["far", "xa", "🔭"], ["way", "lối đi", "🛤️"], ["here", "ở đây", "📍"], ["near", "gần", "🤏"],
      ["over", "bên trên", "⤴️"], ["east", "phía đông", "🧭"], ["west", "phía tây", "🧭"], ["north", "phía bắc", "🧭"],
      ["south", "phía nam", "🧭"], ["front", "phía trước", "⏩"], ["there", "ở kia", "👉"], ["under", "bên dưới", "⤵️"],
      ["start", "xuất phát", "🏁"], ["behind", "phía sau", "⏪"], ["middle", "ở giữa", "🎯"], ["inside", "bên trong", "🏠"],
      ["around", "xung quanh", "⭕"], ["corner", "góc", "📐"], ["outside", "bên ngoài", "🌳"]
    ]
  };
  (window.TOPICS || []).forEach(function (t) {
    var add = EXTRA[t.id]; if (!add) return;
    var have = {}; t.words.forEach(function (w) { have[w[0]] = 1; });
    add.forEach(function (w) { if (!have[w[0]]) { t.words.push(w); have[w[0]] = 1; } });
  });
})();
