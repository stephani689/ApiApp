import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, ActivityIndicator,
  TextInput, TouchableOpacity, Modal, ScrollView, RefreshControl,
  SafeAreaView, StatusBar, Animated, Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 2; // 2-column grid

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#0C0C0E',
  surface:   '#16161A',
  raised:    '#1E1E24',
  border:    '#272730',
  gold:      '#C9A84C',
  goldLight: '#E8C97A',
  goldDim:   '#8B6F2E',
  goldGlow:  'rgba(201,168,76,0.15)',
  text:      '#F0F0F3',
  sub:       '#8A8A9E',
  muted:     '#50505F',
  danger:    '#F87171',
  green:     '#34D399',
};

// ── SORT OPTIONS ───────────────────────────────────────────────────────────────
const SORTS = [
  { key: 'DEFAULT',    label: 'Default',      icon: '◈' },
  { key: 'PRICE_LOW',  label: 'Price: Low ↑', icon: '↑' },
  { key: 'PRICE_HIGH', label: 'Price: High ↓',icon: '↓' },
  { key: 'NAME_AZ',    label: 'Name A → Z',   icon: 'Az' },
];

// ── PRODUCT CARD ───────────────────────────────────────────────────────────────
const ProductCard = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press  = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 8 }).start();

  return (
    <Animated.View style={[s.card, { width: CARD_W, transform: [{ scale }] }]}>
      <TouchableOpacity onPress={() => onPress(item)} onPressIn={() => press(0.96)} onPressOut={() => press(1)} activeOpacity={1}>
        {/* Image area */}
        <View style={s.cardImgBg}>
          <Image source={{ uri: item.image }} style={s.cardImg} resizeMode="contain" />
          <View style={s.cardRatingBadge}>
            <Text style={s.cardRatingText}>★ {item.rating?.rate?.toFixed(1)}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.cardBody}>
          <Text style={s.cardCat} numberOfLines={1}>{item.category.toUpperCase()}</Text>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={s.cardFooter}>
            <Text style={s.cardPrice}>${item.price.toFixed(2)}</Text>
            <Text style={s.cardReviews}>{item.rating?.count}✦</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── APP ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,           setData]           = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [activeCat,      setActiveCat]      = useState('ALL');
  const [sortKey,        setSortKey]        = useState('DEFAULT');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [query,          setQuery]          = useState('');
  const [selected,       setSelected]       = useState(null);
  const [sortSheet,      setSortSheet]      = useState(false);

  const listFade   = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(900)).current;

  // ── FETCH ────────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setError(null);
      const res  = await fetch('https://fakestoreapi.com/products');
      if (!res.ok) throw new Error('Server returned an error. Please try again.');
      const json = await res.json();
      setData(json);
      setFiltered(json);
      setCategories(['ALL', ...new Set(json.map(i => i.category))]);
      setActiveCat('ALL');
      setSortKey('DEFAULT');
      Animated.timing(listFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {
      setError(e.message || 'Network error. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── FILTER LOGIC ─────────────────────────────────────────────────────────────
  const apply = (q, cat, sort, src = data) => {
    let r = [...src];
    if (cat !== 'ALL')     r = r.filter(i => i.category === cat);
    if (q.trim())          r = r.filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === 'PRICE_LOW')  r.sort((a, b) => a.price - b.price);
    if (sort === 'PRICE_HIGH') r.sort((a, b) => b.price - a.price);
    if (sort === 'NAME_AZ')    r.sort((a, b) => a.title.localeCompare(b.title));
    setFiltered(r);
  };

  const onSearch  = (t) => { setQuery(t);    apply(t, activeCat, sortKey); };
  const onCat     = (c) => { setActiveCat(c); apply(query, c, sortKey); };
  const onSort    = (k) => { setSortKey(k);  setSortSheet(false); apply(query, activeCat, k); };
  const onRefresh = ()  => { setRefreshing(true); setQuery(''); fetchData(); };

  const openDetail = (item) => {
    setSelected(item);
    Animated.spring(modalSlide, { toValue: 0, useNativeDriver: true, friction: 9, tension: 55 }).start();
  };
  const closeDetail = () => {
    Animated.timing(modalSlide, { toValue: 900, duration: 300, useNativeDriver: true }).start(() => setSelected(null));
  };

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={s.center}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={s.loadTitle}>CATALOG</Text>
      <Text style={s.loadSub}>Fetching products…</Text>
    </View>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  if (error) return (
    <View style={s.center}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Text style={s.errIcon}>⚠</Text>
      <Text style={s.errTitle}>Failed to Load</Text>
      <Text style={s.errMsg}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); fetchData(); }}>
        <Text style={s.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const sortLabel = SORTS.find(o => o.key === sortKey)?.label || 'Sort';

  // ── MAIN ──────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEye}>PREMIUM STORE</Text>
          <Text style={s.headerTitle}>Catalog</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{filtered.length} items</Text>
        </View>
      </View>

      {/* GOLD LINE */}
      <View style={s.goldLine} />

      {/* SEARCH + SORT */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIco}>⌕</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search products…"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={onSearch}
            selectionColor={C.gold}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => onSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Text style={s.clearIco}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.sortBtn} onPress={() => setSortSheet(true)}>
          <Text style={s.sortIco}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORY CHIPS — fixed-height row */}
      <View style={s.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsList}>
          {categories.map(cat => {
            const active = activeCat === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => onCat(cat)} style={[s.chip, active && s.chipActive]}>
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>
                  {cat === 'ALL' ? 'All' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PRODUCT GRID */}
      <Animated.View style={{ flex: 1, opacity: listFade }}>
        <FlatList
          data={filtered}
          keyExtractor={i => i.id.toString()}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.gridPad}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard item={item} onPress={openDetail} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIco}>◎</Text>
              <Text style={s.emptyTxt}>No Results Found</Text>
              <Text style={s.emptySub}>Try a different filter or search term.</Text>
            </View>
          }
        />
      </Animated.View>

      {/* SORT BOTTOM SHEET */}
      <Modal transparent visible={sortSheet} animationType="fade" onRequestClose={() => setSortSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSortSheet(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>SORT BY</Text>
            {SORTS.map(opt => {
              const active = sortKey === opt.key;
              return (
                <TouchableOpacity key={opt.key} style={[s.sheetOpt, active && s.sheetOptActive]} onPress={() => onSort(opt.key)}>
                  <View style={[s.sheetOptIcon, active && s.sheetOptIconActive]}>
                    <Text style={{ color: active ? C.bg : C.sub, fontSize: 12, fontWeight:'700' }}>{opt.icon}</Text>
                  </View>
                  <Text style={[s.sheetOptTxt, active && s.sheetOptTxtActive]}>{opt.label}</Text>
                  {active && <Text style={s.sheetCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DETAIL MODAL */}
      {selected && (
        <Modal transparent animationType="none" visible={!!selected} onRequestClose={closeDetail}>
          <Animated.View style={[s.modalWrap, { transform: [{ translateY: modalSlide }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Handle */}
              <TouchableOpacity onPress={closeDetail} style={s.modalHandleRow}>
                <View style={s.modalHandleBar} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Image */}
                <View style={s.modalImgBox}>
                  <Image source={{ uri: selected.image }} style={s.modalImg} resizeMode="contain" />
                </View>

                <View style={s.modalBody}>
                  {/* Pills row */}
                  <View style={s.modalPills}>
                    <View style={s.catPill}><Text style={s.catPillTxt}>{selected.category.toUpperCase()}</Text></View>
                    <View style={s.goldPill}><Text style={s.goldPillTxt}>★ {selected.rating?.rate?.toFixed(1)}</Text></View>
                    <View style={s.goldPill}><Text style={s.goldPillTxt}>#{selected.id.toString().padStart(3,'0')}</Text></View>
                  </View>

                  <Text style={s.modalTitle}>{selected.title}</Text>
                  <Text style={s.modalPrice}>${selected.price.toFixed(2)}</Text>

                  {/* Stats row */}
                  <View style={s.statsRow}>
                    {[
                      { label:'RATING',  val: `${selected.rating?.rate}/5` },
                      { label:'REVIEWS', val: selected.rating?.count },
                      { label:'PRICE',   val: `$${selected.price.toFixed(0)}` },
                    ].map((m, i, arr) => (
                      <React.Fragment key={m.label}>
                        <View style={s.statItem}>
                          <Text style={s.statLabel}>{m.label}</Text>
                          <Text style={s.statVal}>{m.val}</Text>
                        </View>
                        {i < arr.length - 1 && <View style={s.statDiv} />}
                      </React.Fragment>
                    ))}
                  </View>

                  <View style={s.descSep} />
                  <Text style={s.descEye}>DESCRIPTION</Text>
                  <Text style={s.descTxt}>{selected.description}</Text>
                </View>
              </ScrollView>

              <TouchableOpacity style={s.closeBtn} onPress={closeDetail}>
                <Text style={s.closeBtnTxt}>Close</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 8 },

  // Loading
  loadTitle: { fontSize: 18, fontWeight:'900', letterSpacing: 6, color: C.gold, marginTop: 16 },
  loadSub:   { fontSize: 12, color: C.muted, letterSpacing: 1 },

  // Error
  errIcon:  { fontSize: 40, color: C.danger },
  errTitle: { fontSize: 18, fontWeight:'800', color: C.text },
  errMsg:   { fontSize: 13, color: C.sub, textAlign:'center', paddingHorizontal: 32, lineHeight: 19 },
  retryBtn: { marginTop: 8, borderWidth: 1, borderColor: C.gold, paddingHorizontal: 28, paddingVertical: 11, borderRadius: 8 },
  retryText:{ color: C.gold, fontWeight:'700' },

  // Header
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  headerEye: { fontSize: 9, fontWeight:'800', letterSpacing: 4, color: C.gold, marginBottom: 2 },
  headerTitle:{ fontSize: 28, fontWeight:'900', color: C.text, letterSpacing: -0.5 },
  countBadge:{ backgroundColor: C.raised, borderWidth:1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  countText: { fontSize: 12, color: C.sub, fontWeight:'500' },

  // Gold line
  goldLine:  { height: 1, marginHorizontal: 20, marginBottom: 14, backgroundColor: C.goldDim, opacity: 0.5 },

  // Search
  searchRow: { flexDirection:'row', paddingHorizontal: 16, marginBottom: 12, gap: 8, alignItems:'center' },
  searchBox: {
    flex: 1, flexDirection:'row', alignItems:'center',
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth:1, borderColor: C.border, paddingHorizontal: 12, height: 44,
  },
  searchIco:   { fontSize: 17, color: C.muted, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  clearIco:    { color: C.muted, fontSize: 13 },
  sortBtn:     {
    width: 44, height: 44, backgroundColor: C.surface, borderRadius: 12,
    borderWidth:1, borderColor: C.border, alignItems:'center', justifyContent:'center',
  },
  sortIco:     { fontSize: 18, color: C.gold },

  // Chips — KEY FIX: fixed height row, chips don't stretch
  chipsRow:  { height: 40, marginBottom: 12 },
  chipsList: { paddingHorizontal: 16, gap: 8, alignItems:'center' },
  chip:      {
    height: 30, paddingHorizontal: 14,
    backgroundColor: C.surface, borderRadius: 15,
    borderWidth:1, borderColor: C.border,
    alignItems:'center', justifyContent:'center',
  },
  chipActive:   { backgroundColor: C.goldDim, borderColor: C.gold },
  chipTxt:      { fontSize: 12, color: C.sub, fontWeight:'600', textTransform:'capitalize' },
  chipTxtActive:{ color: C.goldLight, fontWeight:'800' },

  // Grid
  row:     { paddingHorizontal: 16, justifyContent:'space-between', marginBottom: 12 },
  gridPad: { paddingTop: 4, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth:1, borderColor: C.border, overflow:'hidden',
  },
  cardImgBg: {
    height: 140, backgroundColor: C.raised,
    alignItems:'center', justifyContent:'center',
  },
  cardImg:   { width: '70%', height: '80%' },
  cardRatingBadge: {
    position:'absolute', top: 8, right: 8,
    backgroundColor: C.goldGlow, borderWidth:1, borderColor: 'rgba(201,168,76,0.3)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  cardRatingText: { fontSize: 10, fontWeight:'700', color: C.gold },
  cardBody:  { padding: 10 },
  cardCat:   { fontSize: 8, fontWeight:'800', letterSpacing: 1, color: C.goldDim, marginBottom: 3, textTransform:'uppercase' },
  cardTitle: { fontSize: 12, fontWeight:'600', color: C.text, lineHeight: 17, marginBottom: 8, minHeight: 34 },
  cardFooter:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  cardPrice: { fontSize: 15, fontWeight:'900', color: C.gold },
  cardReviews:{ fontSize: 10, color: C.muted },

  // Empty
  empty:    { alignItems:'center', marginTop: 80 },
  emptyIco: { fontSize: 36, color: C.muted, marginBottom: 12 },
  emptyTxt: { fontSize: 15, fontWeight:'700', color: C.sub, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.muted, textAlign:'center', paddingHorizontal: 40 },

  // Sort sheet
  overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet:          { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingHorizontal: 20, borderTopWidth:1, borderColor: C.border },
  sheetHandle:    { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf:'center', marginTop: 12, marginBottom: 20 },
  sheetTitle:     { fontSize: 10, fontWeight:'800', letterSpacing: 3, color: C.muted, marginBottom: 16 },
  sheetOpt:       { flexDirection:'row', alignItems:'center', gap: 12, paddingVertical: 14, borderBottomWidth:1, borderBottomColor: C.border },
  sheetOptActive: { borderBottomColor: C.goldDim },
  sheetOptIcon:   { width: 30, height: 30, borderRadius: 8, backgroundColor: C.raised, alignItems:'center', justifyContent:'center' },
  sheetOptIconActive:{ backgroundColor: C.gold },
  sheetOptTxt:    { flex:1, fontSize: 15, color: C.sub },
  sheetOptTxtActive:{ color: C.goldLight, fontWeight:'700' },
  sheetCheck:     { color: C.gold, fontSize: 17, fontWeight:'800' },

  // Modal
  modalWrap:      { flex:1, backgroundColor: C.bg },
  modalHandleRow: { paddingVertical: 12, alignItems:'center' },
  modalHandleBar: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2 },
  modalImgBox:    {
    margin: 16, height: 220, borderRadius: 18,
    backgroundColor: C.surface, borderWidth:1, borderColor: C.border,
    alignItems:'center', justifyContent:'center',
  },
  modalImg:    { width:'65%', height:'80%' },
  modalBody:   { paddingHorizontal: 20 },
  modalPills:  { flexDirection:'row', gap: 6, marginBottom: 14, flexWrap:'wrap' },
  catPill:     { backgroundColor: C.raised, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth:1, borderColor: C.border },
  catPillTxt:  { fontSize: 9, fontWeight:'800', color: C.goldDim, letterSpacing: 1 },
  goldPill:    { backgroundColor: C.goldGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth:1, borderColor:'rgba(201,168,76,0.25)' },
  goldPillTxt: { fontSize: 10, fontWeight:'700', color: C.gold },
  modalTitle:  { fontSize: 20, fontWeight:'800', color: C.text, lineHeight: 27, marginBottom: 8 },
  modalPrice:  { fontSize: 30, fontWeight:'900', color: C.gold, letterSpacing: -1, marginBottom: 20 },
  statsRow:    { flexDirection:'row', backgroundColor: C.surface, borderRadius: 14, borderWidth:1, borderColor: C.border, marginBottom: 22, paddingVertical: 14 },
  statItem:    { flex:1, alignItems:'center' },
  statLabel:   { fontSize: 8, fontWeight:'800', letterSpacing: 1.5, color: C.muted, marginBottom: 5 },
  statVal:     { fontSize: 14, fontWeight:'800', color: C.text },
  statDiv:     { width:1, backgroundColor: C.border },
  descSep:     { height:1, backgroundColor: C.border, marginBottom: 16 },
  descEye:     { fontSize: 9, fontWeight:'800', letterSpacing: 2.5, color: C.gold, marginBottom: 10 },
  descTxt:     { fontSize: 14, color: C.sub, lineHeight: 22 },
  closeBtn:    { backgroundColor: C.gold, margin: 16, padding: 16, borderRadius: 14, alignItems:'center' },
  closeBtnTxt: { color: C.bg, fontWeight:'900', fontSize: 15, letterSpacing: 0.5 },
});