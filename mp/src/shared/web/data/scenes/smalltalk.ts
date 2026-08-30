import type { Material, Scene } from '../../types'

/** 社交寒暄：打招呼、闲聊、约人、告别 */
export const smalltalkScene: { scene: Scene; materials: Material[] } = {
  scene: { id: 'smalltalk', name: '社交寒暄', nameEn: 'Small Talk', icon: '💬', desc: '打招呼、闲聊、约人、告别' },
  materials: [
    /* ================= 单词 ================= */
    {
      type: 'word', id: 'st-w1', sceneId: 'smalltalk', en: 'catch up', pos: 'v.',
      ipaUS: '/kætʃ ʌp/', ipaUK: '/kætʃ ʌp/', zh: '叙旧、聊聊近况', spokenLevel: 'high',
      note: '跟老朋友聊天不叫 chat，叫 catch up；约聊说 Let\'s catch up',
      examples: [
        { en: 'We should catch up sometime!', zh: '咱们有空得聚聚聊聊！' },
        { en: 'Let me catch you up on the news.', zh: '我跟你说说最近的动态。' },
      ],
      variants: [{ level: '简单', en: 'talk about old times', zh: '聊聊过去（绕弯说法）' }],
    },
    {
      type: 'word', id: 'st-w2', sceneId: 'smalltalk', en: 'hang out', pos: 'v.',
      ipaUS: '/hæŋ aʊt/', ipaUK: '/hæŋ aʊt/', zh: '一起玩、瞎逛', spokenLevel: 'high',
      note: '朋友间"出去玩"最地道的说法，不是 play',
      examples: [{ en: 'Do you want to hang out this weekend?', zh: '这周末想不想一起出去玩？' }],
      variants: [
        { level: '简单', en: 'spend time together', zh: '一起打发时间' },
        { level: '地道', en: 'chill together', zh: '一起待着（更慵懒随意）' },
      ],
    },
    {
      type: 'word', id: 'st-w3', sceneId: 'smalltalk', en: 'chill', pos: 'v./adj.',
      ipaUS: '/tʃɪl/', ipaUK: '/tʃɪl/', zh: '放松、闲待；随和的', spokenLevel: 'high',
      examples: [
        { en: 'I\'m just chilling at home.', zh: '我就在家躺着呢。' },
        { en: 'He\'s super chill.', zh: '他人特别随和。' },
      ],
      variants: [{ level: '简单', en: 'relax', zh: '放松（标准说法）' }],
    },
    {
      type: 'word', id: 'st-w4', sceneId: 'smalltalk', en: 'vibe', pos: 'n.',
      ipaUS: '/vaɪb/', ipaUK: '/vaɪb/', zh: '氛围、感觉', spokenLevel: 'high',
      note: '超高频口语词：感觉好就是 good vibe / I like the vibe',
      examples: [{ en: 'I love the vibe of this place.', zh: '我好喜欢这地方的氛围。' }],
      variants: [{ level: '简单', en: 'atmosphere', zh: '氛围（偏书面）' }],
    },
    {
      type: 'word', id: 'st-w5', sceneId: 'smalltalk', en: 'plans', pos: 'n.',
      ipaUS: '/plænz/', ipaUK: '/plænz/', zh: '安排、计划', spokenLevel: 'high',
      note: '问周末干嘛就问 Any plans?，不用 future plan',
      examples: [{ en: 'Any plans for tonight?', zh: '今晚有安排吗？' }],
      variants: [{ level: '地道', en: 'anything going on', zh: '有什么事吗（更随意）' }],
    },
    {
      type: 'word', id: 'st-w6', sceneId: 'smalltalk', en: 'awesome', pos: 'adj.',
      ipaUS: '/ˈɔːsəm/', ipaUK: '/ˈɔːsəm/', zh: '超棒的', spokenLevel: 'high',
      examples: [{ en: 'That movie was awesome!', zh: '那电影太棒了！' }],
      variants: [
        { level: '简单', en: 'great', zh: '很好' },
        { level: '地道', en: 'epic', zh: '绝了（年轻人爱用）' },
      ],
    },
    {
      type: 'word', id: 'st-w7', sceneId: 'smalltalk', en: 'exhausted', pos: 'adj.',
      ipaUS: '/ɪɡˈzɔːstɪd/', ipaUK: '/ɪɡˈzɔːstɪd/', zh: '累瘫的', spokenLevel: 'high',
      note: '比 tired 强烈的多了；口语还有 wiped (out)',
      examples: [{ en: 'I\'m completely exhausted today.', zh: '我今天真是累瘫了。' }],
      variants: [
        { level: '简单', en: 'tired', zh: '累的' },
        { level: '地道', en: 'wiped out', zh: '被榨干的（更口语）' },
      ],
    },
    {
      type: 'word', id: 'st-w8', sceneId: 'smalltalk', en: 'gossip', pos: 'n./v.',
      ipaUS: '/ˈɡɑːsɪp/', ipaUK: '/ˈɡɒsɪp/', zh: '八卦；说八卦', spokenLevel: 'ok',
      examples: [{ en: 'Come on, give me the gossip!', zh: '快说，有什么八卦！' }],
      variants: [{ level: '地道', en: 'the tea', zh: '八卦（网络流行语，spill the tea）' }],
    },
    {
      type: 'word', id: 'st-w9', sceneId: 'smalltalk', en: 'introvert', pos: 'n.',
      ipaUS: '/ˈɪntrəvɜːrt/', ipaUK: '/ˈɪntrəvɜːt/', zh: '内向的人', spokenLevel: 'ok',
      examples: [{ en: 'I\'m a total introvert at parties.', zh: '聚会上我就是个彻底的社恐。' }],
      variants: [
        { level: '地道', en: 'homebody', zh: '宅男宅女、爱宅家的人' },
        { level: '日常', en: 'shy person', zh: '害羞的人' },
      ],
    },
    {
      type: 'word', id: 'st-w10', sceneId: 'smalltalk', en: 'night owl', pos: 'n.',
      ipaUS: '/naɪt aʊl/', ipaUK: '/naɪt aʊl/', zh: '夜猫子', spokenLevel: 'ok',
      examples: [{ en: 'I\'m a night owl, I sleep at 2 a.m.', zh: '我是夜猫子，凌晨两点睡。' }],
      variants: [{ level: '简单', en: 'someone who sleeps late', zh: '睡得晚的人（解释性说法）' }],
    },
    {
      type: 'word', id: 'st-w11', sceneId: 'smalltalk', en: 'coincidence', pos: 'n.',
      ipaUS: '/koʊˈɪnsɪdəns/', ipaUK: '/kəʊˈɪnsɪdəns/', zh: '巧合', spokenLevel: 'ok',
      examples: [{ en: 'What a coincidence seeing you here!', zh: '在这儿碰到你太巧了！' }],
      variants: [{ level: '地道', en: 'Small world!', zh: '世界真小！（感叹巧合）' }],
    },
    {
      type: 'word', id: 'st-w12', sceneId: 'smalltalk', en: 'bond', pos: 'n./v.',
      ipaUS: '/bɑːnd/', ipaUK: '/bɒnd/', zh: '感情纽带；拉近关系', spokenLevel: 'ok',
      examples: [{ en: 'We bonded over hotpot.', zh: '我们因为火锅变熟的。' }],
      variants: [{ level: '简单', en: 'become close', zh: '变得亲近' }],
    },
    /* ================= 短语 ================= */
    {
      type: 'phrase', id: 'st-p1', sceneId: 'smalltalk', en: 'long time no see',
      ipaUS: '/lɔːŋ taɪm noʊ siː/', ipaUK: '/lɒŋ taɪm nəʊ siː/',
      zh: '好久不见', spokenLevel: 'high',
      note: '中式英语反哺英语的例子，完全地道可用',
      examples: [{ en: 'Long time no see! How\'s everything?', zh: '好久不见！一切都好吗？' }],
      variants: [{ level: '地道', en: 'It\'s been a while!', zh: '有阵子没见了！' }],
    },
    {
      type: 'phrase', id: 'st-p2', sceneId: 'smalltalk', en: 'what\'s up',
      ipaUS: '/wʌts ʌp/', ipaUK: '/wɒts ʌp/',
      zh: '最近怎么样/怎么了', spokenLevel: 'high',
      note: '回答不是 fine thank you！一般回 Not much / Nothing much',
      examples: [{ en: '—What\'s up? —Not much, just working.', zh: '——最近咋样？——没啥，上班呗。' }],
      variants: [
        { level: '日常', en: 'How\'s it going?', zh: '最近怎么样？' },
        { level: '地道', en: 'What\'s new?', zh: '有什么新鲜事吗？' },
      ],
    },
    {
      type: 'phrase', id: 'st-p3', sceneId: 'smalltalk', en: 'same old, same old',
      ipaUS: '/seɪm oʊld seɪm oʊld/', ipaUK: '/seɪm əʊld seɪm əʊld/',
      zh: '老样子', spokenLevel: 'high',
      examples: [{ en: '—How\'s work? —Same old, same old.', zh: '——工作咋样？——老样子呗。' }],
      variants: [{ level: '简单', en: 'Nothing has changed.', zh: '没什么变化。' }],
    },
    {
      type: 'phrase', id: 'st-p4', sceneId: 'smalltalk', en: 'works for me',
      ipaUS: '/wɜːrks fər miː/', ipaUK: '/wɜːks fə miː/',
      zh: '我没问题、可以', spokenLevel: 'high',
      note: '约定时间地点时表示同意，比 OK 地道',
      examples: [{ en: '—How about 7 p.m.? —Works for me.', zh: '——晚上 7 点怎么样？——我没问题。' }],
      variants: [{ level: '地道', en: 'I\'m good with that.', zh: '我可以。（口语）' }],
    },
    {
      type: 'phrase', id: 'st-p5', sceneId: 'smalltalk', en: 'I\'m down',
      ipaUS: '/aɪm daʊn/', ipaUK: '/aɪm daʊn/',
      zh: '我加入、我感兴趣', spokenLevel: 'high',
      note: '年轻人高频口头禅；书面语禁用',
      examples: [{ en: '—Movie tonight? —I\'m down!', zh: '——今晚看电影？——算我一个！' }],
      variants: [
        { level: '简单', en: 'I want to join.', zh: '我想加入。' },
        { level: '地道', en: 'Count me in!', zh: '带上我！' },
      ],
    },
    {
      type: 'phrase', id: 'st-p6', sceneId: 'smalltalk', en: 'take a rain check',
      ipaUS: '/teɪk ə reɪn tʃek/', ipaUK: '/teɪk ə reɪn tʃek/',
      zh: '改天再约吧', spokenLevel: 'ok',
      examples: [{ en: 'Can I take a rain check? Something came up.', zh: '能改天吗？临时有事。' }],
      variants: [{ level: '简单', en: 'Let\'s do it another day.', zh: '咱们改天再做吧。' }],
    },
    {
      type: 'phrase', id: 'st-p7', sceneId: 'smalltalk', en: 'a lot on my plate',
      ipaUS: '/ə lɑːt ɑːn maɪ pleɪt/', ipaUK: '/ə lɒt ɒn maɪ pleɪt/',
      zh: '事情多到忙不过来', spokenLevel: 'ok',
      note: '委婉拒绝聚会的好借口',
      examples: [{ en: 'I can\'t commit right now—I have a lot on my plate.', zh: '我现在答应不了——手头事太多了。' }],
      variants: [{ level: '简单', en: 'I\'m very busy.', zh: '我太忙了。' }],
    },
    {
      type: 'phrase', id: 'st-p8', sceneId: 'smalltalk', en: 'my place',
      ipaUS: '/maɪ pleɪs/', ipaUK: '/maɪ pleɪs/',
      zh: '我家', spokenLevel: 'high',
      examples: [{ en: 'Come over to my place for dinner.', zh: '来我家吃晚饭吧。' }],
      variants: [{ level: '地道', en: 'my pad', zh: '我的小窝（更随意）' }],
    },
    {
      type: 'phrase', id: 'st-p9', sceneId: 'smalltalk', en: 'catch you later',
      ipaUS: '/kætʃ juː ˈleɪtər/', ipaUK: '/kætʃ jə ˈleɪtə/',
      zh: '回头见', spokenLevel: 'high',
      examples: [{ en: 'I gotta run. Catch you later!', zh: '我得走了，回头见！' }],
      variants: [
        { level: '简单', en: 'See you later.', zh: '再见。' },
        { level: '地道', en: 'Later!', zh: '回见！（极简版）' },
      ],
    },
    {
      type: 'phrase', id: 'st-p10', sceneId: 'smalltalk', en: 'I\'m beat',
      ipaUS: '/aɪm biːt/', ipaUK: '/aɪm biːt/',
      zh: '我累趴了', spokenLevel: 'high',
      examples: [{ en: 'It\'s midnight. I\'m beat, let\'s call it a day.', zh: '半夜了，我累趴了，今天就到这吧。' }],
      variants: [{ level: '简单', en: 'I\'m very tired.', zh: '我很累。' }],
    },
    /* ================= 句子 ================= */
    {
      type: 'sentence', id: 'st-s1', sceneId: 'smalltalk',
      en: 'Long time no see! How have you been?',
      zh: '好久不见！你最近怎么样？', spokenLevel: 'high',
      examples: [
        { en: '—Long time no see! How have you been? —Pretty good! You?', zh: '——好久不见！最近怎么样？——挺好的！你呢？' },
      ],
      variants: [
        { level: '简单', en: 'Hi! How are you?', zh: '嗨！你好吗？' },
        { level: '日常', en: 'It\'s been so long! How are things?', zh: '太久没见了！一切都好吗？' },
        { level: '地道', en: 'No way, look who it is! How\'ve you been?', zh: '我去，这不是你嘛！最近咋样？' },
      ],
      breakdown: [
        { en: 'Long time no see', zh: '好久不见' },
        { en: 'How have you been', zh: '你过得怎么样' },
      ],
      linking: 'Long time no *see! How *have *you *been?',
    },
    {
      type: 'sentence', id: 'st-s2', sceneId: 'smalltalk',
      en: 'What have you been up to lately?',
      zh: '你最近在忙什么呀？', spokenLevel: 'high',
      note: 'be up to = 在干啥；别逐字翻译成"上面到"',
      examples: [
        { en: '—What have you been up to lately? —Just work and gym, nothing exciting.', zh: '——最近忙啥呢？——上班加健身，没啥刺激的。' },
      ],
      variants: [
        { level: '简单', en: 'What are you doing recently?', zh: '你最近在做什么？' },
        { level: '地道', en: 'What\'s new with you?', zh: '你有啥新鲜事吗？' },
      ],
      breakdown: [
        { en: 'What have you been', zh: '你最近一直在' },
        { en: 'up to', zh: '忙什么' },
        { en: 'lately', zh: '最近' },
      ],
      linking: 'What *have *you *been *up *to *lately?',
    },
    {
      type: 'sentence', id: 'st-s3', sceneId: 'smalltalk',
      en: 'Do you have any plans this weekend?',
      zh: '你这周末有什么安排吗？', spokenLevel: 'high',
      examples: [
        { en: '—Do you have any plans this weekend? —Nothing yet, why?', zh: '——周末有安排吗？——还没定，咋啦？' },
      ],
      variants: [
        { level: '简单', en: 'Are you free this weekend?', zh: '你周末有空吗？' },
        { level: '地道', en: 'Any plans for the weekend, or are you free?', zh: '周末有安排吗，还是空着？' },
      ],
      breakdown: [
        { en: 'Do you have any plans', zh: '你有什么安排吗' },
        { en: 'this weekend', zh: '这个周末' },
      ],
      linking: 'Do *you *have‿any *plans *this *weekend?',
      template: {
        pattern: 'Do you have any plans {time}?',
        slots: [
          { key: 'time', label: '时间', options: ['this weekend', 'tonight', 'tomorrow', 'next week', 'on Friday'] },
        ],
      },
    },
    {
      type: 'sentence', id: 'st-s4', sceneId: 'smalltalk',
      en: 'Wanna grab a coffee sometime this week?',
      zh: '这周找个时间一起喝杯咖啡？', spokenLevel: 'high',
      note: 'wanna = want to，口语必备缩读',
      examples: [
        { en: '—Wanna grab a coffee sometime this week? —Sure! How about Wednesday?', zh: '——这周约杯咖啡？——好啊！周三怎么样？' },
      ],
      variants: [
        { level: '简单', en: 'Do you want to drink coffee together?', zh: '你想一起喝咖啡吗？' },
        { level: '日常', en: 'Let\'s get coffee sometime this week.', zh: '这周咱们去喝咖啡吧。' },
        { level: '地道', en: 'Coffee this week? My treat.', zh: '这周喝咖啡？我请。' },
      ],
      breakdown: [
        { en: 'Wanna grab', zh: '想不想来一杯' },
        { en: 'a coffee', zh: '咖啡' },
        { en: 'sometime this week', zh: '这周找时间' },
      ],
      linking: 'Wanna (want to) grab‿a *coffee *sometime *this *week?',
      template: {
        pattern: 'Wanna grab {thing} sometime {time}?',
        slots: [
          { key: 'thing', label: '喝的/吃的', options: ['a coffee', 'lunch', 'dinner', 'a drink', 'bubble tea'] },
          { key: 'time', label: '时间', options: ['this week', 'this weekend', 'after work', 'next Monday'] },
        ],
      },
    },
    {
      type: 'sentence', id: 'st-s5', sceneId: 'smalltalk',
      en: 'I\'m down if you\'re down.',
      zh: '你去我就去。', spokenLevel: 'high',
      examples: [
        { en: '—Beach trip on Saturday? —I\'m down if you\'re down.', zh: '——周六去海边？——你去我就去。' },
      ],
      variants: [
        { level: '简单', en: 'I will go if you go.', zh: '你去我就去。（生硬）' },
        { level: '地道', en: 'Count me in, if you\'re going.', zh: '你去的话算我一个。' },
      ],
      breakdown: [
        { en: 'I\'m down', zh: '我愿意去' },
        { en: 'if you\'re down', zh: '如果你也愿意' },
      ],
      linking: 'I\'m *down *if *you\'re *down.',
    },
    {
      type: 'sentence', id: 'st-s6', sceneId: 'smalltalk',
      en: 'Let\'s hang out sometime soon!',
      zh: '咱们近期约一波啊！', spokenLevel: 'high',
      examples: [
        { en: '—It was so nice seeing you. Let\'s hang out sometime soon! —Definitely!', zh: '——见到你太开心了，近期约一波！——必须的！' },
      ],
      variants: [
        { level: '简单', en: 'Let\'s meet up soon.', zh: '我们尽快见面吧。' },
        { level: '地道', en: 'We should totally hang out soon.', zh: '咱们真该尽快约起来。' },
      ],
      breakdown: [
        { en: 'Let\'s hang out', zh: '咱们一起玩' },
        { en: 'sometime soon', zh: '近期找时间' },
      ],
      linking: 'Let\'s *hang *out *sometime *soon!',
    },
    {
      type: 'sentence', id: 'st-s7', sceneId: 'smalltalk',
      en: 'Sorry, I\'ve got a lot on my plate this week.',
      zh: '抱歉，我这周事情太多了。', spokenLevel: 'ok',
      examples: [
        { en: '—Dinner tomorrow? —Sorry, I\'ve got a lot on my plate this week.', zh: '——明天吃个饭？——抱歉，我这周事太多了。' },
      ],
      variants: [
        { level: '简单', en: 'Sorry, I\'m too busy this week.', zh: '抱歉，我这周太忙了。' },
        { level: '地道', en: 'This week is crazy for me, can we push it?', zh: '我这周忙疯了，能往后推推吗？' },
      ],
      breakdown: [
        { en: 'Sorry', zh: '抱歉' },
        { en: 'I\'ve got a lot on my plate', zh: '我手头事情很多' },
        { en: 'this week', zh: '这周' },
      ],
      linking: 'Sorry, I\'ve *got‿a *lot‿on *my *plate *this *week.',
    },
    {
      type: 'sentence', id: 'st-s8', sceneId: 'smalltalk',
      en: 'How\'s the new job treating you?',
      zh: '新工作干得还顺吗？', spokenLevel: 'ok',
      examples: [
        { en: '—How\'s the new job treating you? —Busy but I love it.', zh: '——新工作还顺吗？——挺忙的但我喜欢。' },
      ],
      variants: [
        { level: '简单', en: 'Is your new job good?', zh: '新工作好吗？' },
        { level: '地道', en: 'How\'s the new gig going?', zh: '新活儿干得咋样？（gig 更俏皮）' },
      ],
      breakdown: [
        { en: 'How\'s the new job', zh: '新工作怎么样' },
        { en: 'treating you', zh: '对你好不好' },
      ],
      linking: 'How\'s the *new *job *treating *you?',
    },
    {
      type: 'sentence', id: 'st-s9', sceneId: 'smalltalk',
      en: 'It was great catching up with you!',
      zh: '跟你聊得太开心了！', spokenLevel: 'high',
      note: '告别神句，比 bye 有温度',
      examples: [
        { en: '—It was great catching up with you! —Same here, let\'s not wait so long next time.', zh: '——跟你叙旧太开心了！——我也是，下次别隔这么久。' },
      ],
      variants: [
        { level: '简单', en: 'I enjoyed talking with you.', zh: '我很喜欢和你聊天。' },
        { level: '地道', en: 'So good catching up—we need to do this more.', zh: '聊得真好——咱们得多聚。' },
      ],
      breakdown: [
        { en: 'It was great', zh: '太开心了' },
        { en: 'catching up with you', zh: '和你聊近况' },
      ],
      linking: 'It *was *great *catching‿up *with *you!',
    },
    {
      type: 'sentence', id: 'st-s10', sceneId: 'smalltalk',
      en: 'I\'m kind of an introvert, so parties tire me out.',
      zh: '我有点社恐，所以参加聚会特别耗电。', spokenLevel: 'ok',
      examples: [
        { en: '—Why don\'t you come to the party? —I\'m kind of an introvert, so parties tire me out.', zh: '——你怎么不来聚会？——我有点社恐，聚会太耗电了。' },
      ],
      variants: [
        { level: '简单', en: 'I\'m shy, so I don\'t like parties.', zh: '我害羞，不太喜欢聚会。' },
        { level: '地道', en: 'Big crowds drain me—I\'m more of a homebody.', zh: '人一多我就累——我更宅一点。' },
      ],
      breakdown: [
        { en: 'I\'m kind of an introvert', zh: '我有点内向' },
        { en: 'so parties tire me out', zh: '所以聚会让我很累' },
      ],
      linking: 'I\'m *kind‿of‿an *introvert, *so *parties *tire *me *out.',
    },
    {
      type: 'sentence', id: 'st-s11', sceneId: 'smalltalk',
      en: 'What a coincidence! I was just thinking about you.',
      zh: '太巧了吧！我刚还在想你呢。', spokenLevel: 'high',
      examples: [
        { en: '—What a coincidence! I was just thinking about you. —Stop it, really?', zh: '——太巧了！我刚想到你。——别闹，真的吗？' },
      ],
      variants: [
        { level: '简单', en: 'I just thought of you.', zh: '我刚想到你。' },
        { level: '地道', en: 'Speak of the devil! We were just talking about you.', zh: '说曹操曹操到！我们刚在聊你。' },
      ],
      breakdown: [
        { en: 'What a coincidence', zh: '真巧啊' },
        { en: 'I was just thinking about you', zh: '我刚在想你' },
      ],
      linking: 'What‿a *coincidence! I *was *just *thinking‿about *you.',
    },
    {
      type: 'sentence', id: 'st-s12', sceneId: 'smalltalk',
      en: 'I gotta run, but let\'s do this again soon.',
      zh: '我得先走了，咱们下次再约。', spokenLevel: 'high',
      note: 'gotta = got to，口语高频缩读',
      examples: [
        { en: '—I gotta run, but let\'s do this again soon. —For sure! Text me.', zh: '——我得先走了，下次再约。——必须的！发消息给我。' },
      ],
      variants: [
        { level: '简单', en: 'I need to leave now. See you next time.', zh: '我得走了，下次见。' },
        { level: '地道', en: 'I\'m off—but let\'s make this a regular thing.', zh: '我先撤了——但咱们得常约。' },
      ],
      breakdown: [
        { en: 'I gotta run', zh: '我得赶紧走了' },
        { en: 'let\'s do this again soon', zh: '咱们很快再约' },
      ],
      linking: 'I *gotta (got to) *run, *but *let\'s *do *this‿again *soon.',
    },
  ],
}
