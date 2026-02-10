import {
  AbstractComponent,
  AbstractPureComponent,
  Button,
  Cross,
  DISPLAYNAME_PREFIX,
  InputGroup,
  Menu,
  Overlay2,
  Popover,
  PopupKind,
  Search,
  TagInput,
  classes_exports,
  mergeRefs,
  refHandler,
  require_jsx_runtime,
  setRef,
  utils_exports
} from "./chunk-XY3LCTUC.js";
import "./chunk-I3NABOFB.js";
import "./chunk-KMDP5OJR.js";
import "./chunk-L22N6EOR.js";
import "./chunk-QBI6Y6X7.js";
import "./chunk-7P3OTVNA.js";
import {
  require_classnames
} from "./chunk-6VVNEJPD.js";
import {
  require_react
} from "./chunk-TWJRYSII.js";
import {
  __export,
  __publicField,
  __toESM
} from "./chunk-DC5AMYBS.js";

// node_modules/@blueprintjs/select/lib/esm/common/classes.js
var classes_exports2 = {};
__export(classes_exports2, {
  MULTISELECT: () => MULTISELECT,
  MULTISELECT_POPOVER: () => MULTISELECT_POPOVER,
  MULTISELECT_POPOVER_DEFAULT_WIDTH: () => MULTISELECT_POPOVER_DEFAULT_WIDTH,
  MULTISELECT_POPOVER_TAG_INPUT_MARGIN: () => MULTISELECT_POPOVER_TAG_INPUT_MARGIN,
  MULTISELECT_TAG_INPUT_INPUT: () => MULTISELECT_TAG_INPUT_INPUT,
  OMNIBAR: () => OMNIBAR,
  OMNIBAR_OVERLAY: () => OMNIBAR_OVERLAY,
  SELECT_POPOVER: () => SELECT_POPOVER,
  SUGGEST_POPOVER: () => SUGGEST_POPOVER
});
var NS = classes_exports.getClassNamespace();
var MULTISELECT = `${NS}-multi-select`;
var MULTISELECT_POPOVER = `${MULTISELECT}-popover`;
var MULTISELECT_POPOVER_DEFAULT_WIDTH = `${MULTISELECT}-popover-default-width`;
var MULTISELECT_POPOVER_TAG_INPUT_MARGIN = `${MULTISELECT}-popover-tag-input-margin`;
var MULTISELECT_TAG_INPUT_INPUT = `${MULTISELECT}-tag-input-input`;
var OMNIBAR = `${NS}-omnibar`;
var OMNIBAR_OVERLAY = `${OMNIBAR}-overlay`;
var SELECT_POPOVER = `${NS}-select-popover`;
var SUGGEST_POPOVER = `${NS}-suggest-popover`;

// node_modules/@blueprintjs/select/lib/esm/common/itemListRenderer.js
function renderFilteredItems(props, noResults, initialContent) {
  if (props.query.length === 0 && initialContent !== void 0) {
    return initialContent;
  }
  const items = props.filteredItems.map(props.renderItem).filter((item) => item != null);
  return items.length > 0 ? items : noResults;
}

// node_modules/@blueprintjs/select/lib/esm/common/listItemsProps.js
function executeItemsEqual(itemsEqualProp, itemA, itemB) {
  if (itemsEqualProp === void 0 || itemA == null || itemB == null) {
    return itemA === itemB;
  }
  if (utils_exports.isFunction(itemsEqualProp)) {
    return itemsEqualProp(itemA, itemB);
  } else {
    return itemA[itemsEqualProp] === itemB[itemsEqualProp];
  }
}

// node_modules/@blueprintjs/select/lib/esm/common/listItemsUtils.js
function getCreateNewItem() {
  return { __blueprintCreateNewItemBrand: "blueprint-create-new-item" };
}
function isCreateNewItem(item) {
  if (item == null) {
    return false;
  }
  const keys = Object.keys(item);
  if (keys.length !== 1 || keys[0] !== "__blueprintCreateNewItemBrand") {
    return false;
  }
  return item.__blueprintCreateNewItemBrand === "blueprint-create-new-item";
}
function getActiveItem(activeItem) {
  return activeItem == null || isCreateNewItem(activeItem) ? null : activeItem;
}

// node_modules/@blueprintjs/select/lib/esm/components/multi-select/multiSelect.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var import_classnames = __toESM(require_classnames());
var import_react = __toESM(require_react());

// node_modules/@blueprintjs/select/lib/esm/components/query-list/queryList.js
var import_jsx_runtime = __toESM(require_jsx_runtime());
var _QueryList = class _QueryList extends AbstractComponent {
  constructor(props) {
    var _a4;
    super(props);
    __publicField(this, "itemsParentRef");
    __publicField(this, "itemRefs", /* @__PURE__ */ new Map());
    __publicField(this, "listId");
    __publicField(this, "refHandlers", {
      itemsParent: (ref) => this.itemsParentRef = ref
    });
    /**
     * Flag indicating that we should check whether selected item is in viewport
     * after rendering, typically because of keyboard change. Set to `true` when
     * manipulating state in a way that may cause active item to scroll away.
     */
    __publicField(this, "shouldCheckActiveItemInViewport", false);
    /**
     * The item that we expect to be the next selected active item (based on click
     * or key interactions). When scrollToActiveItem = false, used to detect if
     * an unexpected external change to the active item has been made.
     */
    __publicField(this, "expectedNextActiveItem", null);
    /**
     * Flag which is set to true while in between an ENTER "keydown" event and its
     * corresponding "keyup" event.
     *
     * When entering text via an IME (https://en.wikipedia.org/wiki/Input_method),
     * the ENTER key is pressed to confirm the character(s) to be input from a list
     * of options. The operating system intercepts the ENTER "keydown" event and
     * prevents it from propagating to the application, but "keyup" is still
     * fired, triggering a spurious event which this component does not expect.
     *
     * To work around this quirk, we keep track of "real" key presses by setting
     * this flag in handleKeyDown.
     */
    __publicField(this, "isEnterKeyPressed", false);
    /** default `itemListRenderer` implementation */
    __publicField(this, "renderItemList", (listProps) => {
      const { initialContent, noResults } = this.props;
      const createItemView = listProps.renderCreateItem();
      const maybeNoResults = createItemView != null ? null : noResults;
      const menuContent = renderFilteredItems(listProps, maybeNoResults, initialContent);
      if (menuContent == null && createItemView == null) {
        return null;
      }
      const createFirst = this.isCreateItemFirst();
      return (0, import_jsx_runtime.jsxs)(Menu, { role: "listbox", ...listProps.menuProps, ulRef: listProps.itemsParentRef, children: [createFirst && createItemView, menuContent, !createFirst && createItemView] });
    });
    /** wrapper around `itemRenderer` to inject props */
    __publicField(this, "renderItem", (item, index) => {
      if (this.props.disabled !== true) {
        const { activeItem, query, filteredItems } = this.state;
        const modifiers = {
          active: executeItemsEqual(this.props.itemsEqual, getActiveItem(activeItem), item),
          disabled: isItemDisabled(item, index, this.props.itemDisabled),
          matchesPredicate: filteredItems.indexOf(item) >= 0
        };
        const itemId = `${this.listId}-item-${index}`;
        return this.props.itemRenderer(item, {
          handleClick: (e) => this.handleItemSelect(item, e),
          handleFocus: () => this.setActiveItem(item),
          id: itemId,
          index,
          modifiers,
          query,
          ref: (node) => {
            if (node) {
              this.itemRefs.set(index, node);
            } else {
              this.itemRefs.delete(index);
            }
          }
        });
      }
      return null;
    });
    __publicField(this, "renderCreateItemMenuItem", () => {
      if (this.isCreateItemRendered(this.state.createNewItem)) {
        const { activeItem, query } = this.state;
        const trimmedQuery = query.trim();
        const handleClick = (evt) => {
          this.handleItemCreate(trimmedQuery, evt);
        };
        const isActive = isCreateNewItem(activeItem);
        return this.props.createNewItemRenderer(trimmedQuery, isActive, handleClick);
      }
      return null;
    });
    __publicField(this, "handleItemCreate", (query, evt) => {
      var _a4, _b, _c, _d;
      const value = (_b = (_a4 = this.props).createNewItemFromQuery) == null ? void 0 : _b.call(_a4, query);
      if (value != null) {
        const newItems = Array.isArray(value) ? value : [value];
        for (const item of newItems) {
          (_d = (_c = this.props).onItemSelect) == null ? void 0 : _d.call(_c, item, evt);
        }
        this.maybeResetQuery();
      }
    });
    __publicField(this, "handleItemSelect", (item, event) => {
      var _a4, _b;
      this.setActiveItem(item);
      (_b = (_a4 = this.props).onItemSelect) == null ? void 0 : _b.call(_a4, item, event);
      this.maybeResetQuery();
    });
    __publicField(this, "handlePaste", (queries) => {
      const { createNewItemFromQuery, onItemsPaste } = this.props;
      let nextActiveItem;
      const nextQueries = [];
      const pastedItemsToEmit = [];
      for (const query of queries) {
        const equalItem = getMatchingItem(query, this.props);
        if (equalItem !== void 0) {
          nextActiveItem = equalItem;
          pastedItemsToEmit.push(equalItem);
        } else if (this.canCreateItems()) {
          const value = createNewItemFromQuery == null ? void 0 : createNewItemFromQuery(query);
          if (value !== void 0) {
            const newItems = Array.isArray(value) ? value : [value];
            pastedItemsToEmit.push(...newItems);
          }
        } else {
          nextQueries.push(query);
        }
      }
      this.setQuery(nextQueries.join(", "), false);
      if (nextActiveItem !== void 0) {
        this.setActiveItem(nextActiveItem);
      }
      onItemsPaste == null ? void 0 : onItemsPaste(pastedItemsToEmit);
    });
    __publicField(this, "handleKeyDown", (event) => {
      var _a4, _b;
      if (!event.nativeEvent.isComposing) {
        const { key } = event;
        const direction = utils_exports.getArrowKeyDirection(event, ["ArrowUp"], ["ArrowDown"]);
        if (direction !== void 0) {
          event.preventDefault();
          const nextActiveItem = this.getNextActiveItem(direction);
          if (nextActiveItem != null) {
            this.setActiveItem(nextActiveItem);
          }
        } else if (key === "Enter") {
          this.isEnterKeyPressed = true;
        }
      }
      (_b = (_a4 = this.props).onKeyDown) == null ? void 0 : _b.call(_a4, event);
    });
    __publicField(this, "handleKeyUp", (event) => {
      const { onKeyUp } = this.props;
      const { activeItem } = this.state;
      if (event.key === "Enter" && this.isEnterKeyPressed) {
        event.preventDefault();
        if (activeItem == null || isCreateNewItem(activeItem)) {
          this.handleItemCreate(this.state.query, event);
        } else {
          this.handleItemSelect(activeItem, event);
        }
        this.isEnterKeyPressed = false;
      }
      onKeyUp == null ? void 0 : onKeyUp(event);
    });
    __publicField(this, "handleInputQueryChange", (event) => {
      var _a4, _b;
      const query = event == null ? "" : event.target.value;
      this.setQuery(query);
      (_b = (_a4 = this.props).onQueryChange) == null ? void 0 : _b.call(_a4, query, event);
    });
    this.listId = props.listId ?? utils_exports.uniqueId("bp-query-list");
    const { query = "" } = props;
    const createNewItem = (_a4 = props.createNewItemFromQuery) == null ? void 0 : _a4.call(props, query);
    const filteredItems = getFilteredItems(query, props);
    this.state = {
      activeItem: props.activeItem !== void 0 ? props.activeItem : props.initialActiveItem ?? getFirstEnabledItem(filteredItems, props.itemDisabled),
      createNewItem,
      filteredItems,
      query
    };
  }
  /** @deprecated no longer necessary now that the TypeScript parser supports type arguments on JSX element tags */
  static ofType() {
    return _QueryList;
  }
  render() {
    const { className, items, renderer, itemListRenderer = this.renderItemList, menuProps } = this.props;
    const { createNewItem, ...spreadableState } = this.state;
    const activeItemId = this.getActiveItemId();
    return renderer({
      ...spreadableState,
      activeItemId,
      className,
      handleItemSelect: this.handleItemSelect,
      handleKeyDown: this.handleKeyDown,
      handleKeyUp: this.handleKeyUp,
      handlePaste: this.handlePaste,
      handleQueryChange: this.handleInputQueryChange,
      itemList: itemListRenderer({
        ...spreadableState,
        items,
        itemsParentRef: this.refHandlers.itemsParent,
        menuProps: {
          ...menuProps,
          id: this.listId
        },
        renderCreateItem: this.renderCreateItemMenuItem,
        renderItem: this.renderItem
      }),
      listId: this.listId
    });
  }
  componentDidUpdate(prevProps) {
    if (this.props.activeItem !== void 0 && this.props.activeItem !== this.state.activeItem) {
      this.shouldCheckActiveItemInViewport = true;
      this.setState({ activeItem: this.props.activeItem });
    }
    if (this.props.query != null && this.props.query !== prevProps.query) {
      this.setQuery(this.props.query, this.props.resetOnQuery, this.props);
    } else if (
      // same query (or uncontrolled query), but items in the list changed
      !utils_exports.shallowCompareKeys(this.props, prevProps, {
        include: ["items", "itemListPredicate", "itemPredicate"]
      })
    ) {
      this.setQuery(this.state.query);
    }
    if (this.shouldCheckActiveItemInViewport) {
      this.requestAnimationFrame(() => this.scrollActiveItemIntoView());
      this.shouldCheckActiveItemInViewport = false;
    }
  }
  scrollActiveItemIntoView() {
    const scrollToActiveItem = this.props.scrollToActiveItem !== false;
    const externalChangeToActiveItem = !executeItemsEqual(this.props.itemsEqual, getActiveItem(this.expectedNextActiveItem), getActiveItem(this.props.activeItem));
    this.expectedNextActiveItem = null;
    if (!scrollToActiveItem && externalChangeToActiveItem) {
      return;
    }
    const activeElement = this.getActiveElement();
    if (this.itemsParentRef != null && activeElement != null) {
      const { offsetTop: activeTop, offsetHeight: activeHeight } = activeElement;
      const { offsetTop: parentOffsetTop, scrollTop: parentScrollTop, clientHeight: parentHeight } = this.itemsParentRef;
      const { paddingTop, paddingBottom } = this.getItemsParentPadding();
      const activeBottomEdge = activeTop + activeHeight + paddingBottom - parentOffsetTop;
      const activeTopEdge = activeTop - paddingTop - parentOffsetTop;
      if (activeBottomEdge >= parentScrollTop + parentHeight) {
        this.itemsParentRef.scrollTop = activeBottomEdge + activeHeight - parentHeight;
      } else if (activeTopEdge <= parentScrollTop) {
        this.itemsParentRef.scrollTop = activeTopEdge - activeHeight;
      }
    }
  }
  setQuery(query, resetActiveItem = this.props.resetOnQuery, props = this.props) {
    var _a4;
    const { createNewItemFromQuery } = props;
    this.shouldCheckActiveItemInViewport = true;
    const hasQueryChanged = query !== this.state.query;
    if (hasQueryChanged) {
      (_a4 = props.onQueryChange) == null ? void 0 : _a4.call(props, query);
    }
    const trimmedQuery = query.trim();
    const filteredItems = getFilteredItems(trimmedQuery, props);
    const createNewItem = createNewItemFromQuery != null && trimmedQuery !== "" ? createNewItemFromQuery(trimmedQuery) : void 0;
    this.setState({ createNewItem, filteredItems, query });
    const activeIndex = this.getActiveIndex(filteredItems);
    const shouldUpdateActiveItem = resetActiveItem || activeIndex < 0 || isItemDisabled(getActiveItem(this.state.activeItem), activeIndex, props.itemDisabled);
    if (shouldUpdateActiveItem) {
      if (this.isCreateItemRendered(createNewItem) && this.isCreateItemFirst()) {
        this.setActiveItem(getCreateNewItem());
      } else {
        this.setActiveItem(getFirstEnabledItem(filteredItems, props.itemDisabled));
      }
    }
  }
  setActiveItem(activeItem) {
    var _a4, _b, _c, _d;
    this.expectedNextActiveItem = activeItem;
    if (this.props.activeItem === void 0) {
      this.shouldCheckActiveItemInViewport = true;
      this.setState({ activeItem });
    }
    if (isCreateNewItem(activeItem)) {
      (_b = (_a4 = this.props).onActiveItemChange) == null ? void 0 : _b.call(_a4, null, true);
    } else {
      (_d = (_c = this.props).onActiveItemChange) == null ? void 0 : _d.call(_c, activeItem, false);
    }
  }
  getActiveElement() {
    const { activeItem } = this.state;
    if (this.itemsParentRef != null) {
      if (isCreateNewItem(activeItem)) {
        const index = this.isCreateItemFirst() ? 0 : this.state.filteredItems.length;
        return this.itemsParentRef.children.item(index);
      } else {
        const activeIndex = this.getActiveIndex();
        return this.itemRefs.get(activeIndex) ?? this.itemsParentRef.children.item(activeIndex);
      }
    }
    return void 0;
  }
  getActiveIndex(items = this.state.filteredItems) {
    const { activeItem } = this.state;
    if (activeItem == null || isCreateNewItem(activeItem)) {
      return -1;
    }
    for (let i = 0; i < items.length; ++i) {
      if (executeItemsEqual(this.props.itemsEqual, items[i], activeItem)) {
        return i;
      }
    }
    return -1;
  }
  getItemsParentPadding() {
    const { paddingTop, paddingBottom } = getComputedStyle(this.itemsParentRef);
    return {
      paddingBottom: pxToNumber(paddingBottom),
      paddingTop: pxToNumber(paddingTop)
    };
  }
  /**
   * Get the next enabled item, moving in the given direction from the start
   * index. A `null` return value means no suitable item was found.
   *
   * @param direction amount to move in each iteration, typically +/-1
   * @param startIndex item to start iteration
   */
  getNextActiveItem(direction, startIndex = this.getActiveIndex()) {
    if (this.isCreateItemRendered(this.state.createNewItem)) {
      const reachedCreate = startIndex === 0 && direction === -1 || startIndex === this.state.filteredItems.length - 1 && direction === 1;
      if (reachedCreate) {
        return getCreateNewItem();
      }
    }
    return getFirstEnabledItem(this.state.filteredItems, this.props.itemDisabled, direction, startIndex);
  }
  /**
   * @param createNewItem Checks if this item would match the current query. Cannot check this.state.createNewItem
   *  every time since state may not have been updated yet.
   */
  isCreateItemRendered(createNewItem) {
    return this.canCreateItems() && this.state.query !== "" && // this check is unfortunately O(N) on the number of items, but
    // alas, hiding the "Create Item" option when it exactly matches an
    // existing item is much clearer.
    !this.wouldCreatedItemMatchSomeExistingItem(createNewItem);
  }
  isCreateItemFirst() {
    return this.props.createNewItemPosition === "first";
  }
  canCreateItems() {
    return this.props.createNewItemFromQuery != null && this.props.createNewItemRenderer != null;
  }
  wouldCreatedItemMatchSomeExistingItem(createNewItem) {
    return this.state.filteredItems.some((item) => {
      const newItems = Array.isArray(createNewItem) ? createNewItem : [createNewItem];
      return newItems.some((newItem) => executeItemsEqual(this.props.itemsEqual, item, newItem));
    });
  }
  maybeResetQuery() {
    if (this.props.resetOnSelect) {
      this.setQuery("", true);
    }
  }
  /** Generate unique ID for the currently active item */
  getActiveItemId() {
    const { activeItem } = this.state;
    if (activeItem == null) {
      return void 0;
    }
    if (isCreateNewItem(activeItem)) {
      return `${this.listId}-create-item`;
    }
    const activeIndex = this.getActiveIndex();
    return activeIndex >= 0 ? `${this.listId}-item-${activeIndex}` : void 0;
  }
};
__publicField(_QueryList, "displayName", `${DISPLAYNAME_PREFIX}.QueryList`);
__publicField(_QueryList, "defaultProps", {
  disabled: false,
  resetOnQuery: true
});
var QueryList = _QueryList;
function pxToNumber(value) {
  return value == null ? 0 : parseInt(value.slice(0, -2), 10);
}
function getMatchingItem(query, { items, itemPredicate }) {
  if (utils_exports.isFunction(itemPredicate)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (itemPredicate(query, item, i, true)) {
        return item;
      }
    }
  }
  return void 0;
}
function getFilteredItems(query, { items, itemPredicate, itemListPredicate }) {
  if (utils_exports.isFunction(itemListPredicate)) {
    return itemListPredicate(query, items);
  } else if (utils_exports.isFunction(itemPredicate)) {
    return items.filter((item, index) => itemPredicate(query, item, index));
  }
  return items;
}
function wrapNumber(value, min, max) {
  if (value < min) {
    return max;
  } else if (value > max) {
    return min;
  }
  return value;
}
function isItemDisabled(item, index, itemDisabled) {
  if (itemDisabled == null || item == null) {
    return false;
  } else if (utils_exports.isFunction(itemDisabled)) {
    return itemDisabled(item, index);
  }
  return !!item[itemDisabled];
}
function getFirstEnabledItem(items, itemDisabled, direction = 1, startIndex = items.length - 1) {
  if (items.length === 0) {
    return null;
  }
  let index = startIndex;
  const maxIndex = items.length - 1;
  do {
    index = wrapNumber(index + direction, 0, maxIndex);
    if (!isItemDisabled(items[index], index, itemDisabled)) {
      return items[index];
    }
  } while (index !== startIndex && startIndex !== -1);
  return null;
}

// node_modules/@blueprintjs/select/lib/esm/components/multi-select/multiSelect.js
var _a;
var _MultiSelect = class _MultiSelect extends AbstractPureComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "listboxId", utils_exports.uniqueId("listbox"));
    __publicField(this, "state", {
      isOpen: this.props.popoverProps && this.props.popoverProps.isOpen || false
    });
    __publicField(this, "input", null);
    __publicField(this, "queryList", null);
    __publicField(this, "refHandlers", {
      input: refHandler(this, "input", (_a = this.props.tagInputProps) == null ? void 0 : _a.inputRef),
      popover: (0, import_react.createRef)(),
      queryList: (ref) => this.queryList = ref
    });
    __publicField(this, "renderQueryList", (listProps) => {
      var _a4;
      const { disabled, popoverContentProps = {}, popoverProps = {} } = this.props;
      const { handleKeyDown, handleKeyUp } = listProps;
      return (0, import_jsx_runtime2.jsx)(Popover, { autoFocus: false, canEscapeKeyClose: true, disabled, enforceFocus: false, isOpen: this.state.isOpen, placement: popoverProps.position || popoverProps.placement ? void 0 : "bottom-start", ...popoverProps, className: (0, import_classnames.default)(listProps.className, popoverProps.className), content: (0, import_jsx_runtime2.jsxs)("div", {
        // In the case where customTarget is supplied and the TagInput is rendered within the Popover,
        // without matchTargetWidth there is no width defined in any of TagInput's
        // grandparents when it's rendered through usePortal, so it will never flex-wrap
        // and infinitely grow horizontally. To address this, if there is no width guidance
        // from matchTargetWidth, explicitly set a default width to so Tags will flex-wrap.
        className: this.props.customTarget != null && !((_a4 = this.props.popoverProps) == null ? void 0 : _a4.matchTargetWidth) ? classes_exports2.MULTISELECT_POPOVER_DEFAULT_WIDTH : void 0,
        ...popoverContentProps,
        onKeyDown: handleKeyDown,
        onKeyUp: handleKeyUp,
        children: [this.props.customTarget != null && this.getTagInput(listProps, (0, import_classnames.default)(classes_exports.FILL, classes_exports2.MULTISELECT_POPOVER_TAG_INPUT_MARGIN)), listProps.itemList]
      }), interactionKind: "click", onInteraction: this.handlePopoverInteraction, onOpened: this.handlePopoverOpened, popoverClassName: (0, import_classnames.default)(classes_exports2.MULTISELECT_POPOVER, popoverProps.popoverClassName), popupKind: PopupKind.LISTBOX, ref: mergeRefs(this.refHandlers.popover, this.props.popoverRef), renderTarget: this.getPopoverTargetRenderer(listProps, this.state.isOpen) });
    });
    // We use the renderTarget API to flatten the rendered DOM and make it easier to implement features like
    // the "fill" prop. Note that we must take `isOpen` as an argument to force this render function to be called
    // again after that state changes.
    __publicField(this, "getPopoverTargetRenderer", (listProps, isOpen) => (
      // N.B. pull out `isOpen` so that it's not forwarded to the DOM, but remember not to use it directly
      // since it may be stale (`renderTarget` is not re-invoked on this.state changes).
      // eslint-disable-next-line react/display-name
      ({ isOpen: _isOpen, ref, ...targetProps }) => {
        const { disabled, fill, selectedItems, popoverProps = {}, popoverTargetProps = {} } = this.props;
        const { handleKeyDown, handleKeyUp } = listProps;
        const { targetTagName = "div" } = popoverProps;
        return (0, import_react.createElement)(targetTagName, {
          "aria-autocomplete": "list",
          "aria-controls": this.listboxId,
          ...popoverTargetProps,
          ...targetProps,
          "aria-disabled": disabled,
          "aria-expanded": isOpen,
          // Note that we must set FILL here in addition to TagInput to get the wrapper element to full width
          className: (0, import_classnames.default)(targetProps.className, popoverTargetProps.className, {
            [classes_exports.FILL]: fill
          }),
          // Normally, Popover would also need to attach its own `onKeyDown` handler via `targetProps`,
          // but in our case we fully manage that interaction and listen for key events to open/close
          // the popover, so we elide it from the DOM.
          onKeyDown: this.getTagInputKeyDownHandler(handleKeyDown),
          onKeyUp: this.getTagInputKeyUpHandler(handleKeyUp),
          ref,
          role: "combobox"
        }, this.props.customTarget != null ? this.props.customTarget(selectedItems, isOpen) : this.getTagInput(listProps));
      }
    ));
    __publicField(this, "getTagInput", (listProps, className) => {
      var _a4;
      const { disabled, fill, onClear, placeholder, selectedItems, tagInputProps = {} } = this.props;
      const maybeClearButton = onClear !== void 0 && selectedItems.length > 0 ? (
        // use both aria-label and title a11y attributes here, for screen readers
        // and mouseover interactions respectively
        (0, import_jsx_runtime2.jsx)(Button, { "aria-label": "Clear selected items", disabled, icon: (0, import_jsx_runtime2.jsx)(Cross, {}), onClick: this.handleClearButtonClick, title: "Clear selected items", variant: "minimal" })
      ) : void 0;
      const inputProps = {
        ...tagInputProps.inputProps,
        className: (0, import_classnames.default)((_a4 = tagInputProps.inputProps) == null ? void 0 : _a4.className, classes_exports2.MULTISELECT_TAG_INPUT_INPUT)
      };
      return (0, import_jsx_runtime2.jsx)(TagInput, { placeholder, rightElement: maybeClearButton, ...tagInputProps, className: (0, import_classnames.default)(className, classes_exports2.MULTISELECT, tagInputProps.className), disabled, fill, inputRef: this.refHandlers.input, inputProps, inputValue: listProps.query, onAdd: this.getTagInputAddHandler(listProps), onInputChange: listProps.handleQueryChange, onRemove: this.handleTagRemove, values: selectedItems.map(this.props.tagRenderer) });
    });
    __publicField(this, "handleItemSelect", (item, evt) => {
      var _a4, _b, _c;
      if (this.input != null) {
        this.input.focus();
      }
      (_b = (_a4 = this.props).onItemSelect) == null ? void 0 : _b.call(_a4, item, evt);
      (_c = this.refHandlers.popover.current) == null ? void 0 : _c.reposition();
    });
    __publicField(this, "handleQueryChange", (query, evt) => {
      var _a4, _b;
      this.setState({ isOpen: query.length > 0 || this.props.customTarget == null && !this.props.openOnKeyDown });
      (_b = (_a4 = this.props).onQueryChange) == null ? void 0 : _b.call(_a4, query, evt);
    });
    // Popover interaction kind is CLICK, so this only handles click events.
    // Note that we defer to the next animation frame in order to get the latest activeElement
    __publicField(this, "handlePopoverInteraction", (nextOpenState, evt) => {
      var _a4, _b;
      if (this.props.customTarget != null) {
        this.setState({ isOpen: nextOpenState });
        (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onInteraction) == null ? void 0 : _b.call(_a4, nextOpenState, evt);
        return;
      }
      this.requestAnimationFrame(() => {
        var _a5, _b2;
        const isInputFocused = this.input === utils_exports.getActiveElement(this.input);
        if (this.input != null && !isInputFocused) {
          this.setState({ isOpen: false });
        } else if (!this.props.openOnKeyDown) {
          this.setState({ isOpen: true });
        }
        (_b2 = (_a5 = this.props.popoverProps) == null ? void 0 : _a5.onInteraction) == null ? void 0 : _b2.call(_a5, nextOpenState, evt);
      });
    });
    __publicField(this, "handlePopoverOpened", (node) => {
      var _a4, _b, _c, _d;
      if (this.queryList != null) {
        this.queryList.scrollActiveItemIntoView();
      }
      const hasCustomTarget = this.props.customTarget != null;
      if (hasCustomTarget && this.input != null) {
        const shouldAutofocus = ((_b = (_a4 = this.props.tagInputProps) == null ? void 0 : _a4.inputProps) == null ? void 0 : _b.autoFocus) !== false;
        if (shouldAutofocus) {
          this.input.focus();
        }
      }
      (_d = (_c = this.props.popoverProps) == null ? void 0 : _c.onOpened) == null ? void 0 : _d.call(_c, node);
    });
    __publicField(this, "handleTagRemove", (tag, index) => {
      var _a4, _b;
      const { selectedItems, onRemove, tagInputProps } = this.props;
      onRemove == null ? void 0 : onRemove(selectedItems[index], index);
      (_a4 = tagInputProps == null ? void 0 : tagInputProps.onRemove) == null ? void 0 : _a4.call(tagInputProps, tag, index);
      (_b = this.refHandlers.popover.current) == null ? void 0 : _b.reposition();
    });
    __publicField(this, "getTagInputAddHandler", (listProps) => (values, method) => {
      if (method === "paste") {
        listProps.handlePaste(values);
      }
    });
    __publicField(this, "getTagInputKeyDownHandler", (handleQueryListKeyDown) => {
      return (e) => {
        var _a4, _b, _c;
        if (e.key === "Escape" || e.key === "Tab") {
          if (e.key === "Escape") {
            (_a4 = this.input) == null ? void 0 : _a4.blur();
            e.stopPropagation();
            e.preventDefault();
          }
          this.setState({ isOpen: false });
        } else if (!(e.key === "Backspace" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          if (this.props.customTarget != null) {
            if (e.key === " ") {
              e.preventDefault();
              this.setState({ isOpen: true });
            } else if (e.key === "Enter") {
              this.setState({ isOpen: true });
            }
          } else {
            this.setState({ isOpen: true });
          }
        }
        const isTargetingTagRemoveButton = e.target.closest(`.${classes_exports.TAG_REMOVE}`) != null;
        if (this.state.isOpen && !isTargetingTagRemoveButton) {
          handleQueryListKeyDown == null ? void 0 : handleQueryListKeyDown(e);
        }
        (_c = (_b = this.props.popoverTargetProps) == null ? void 0 : _b.onKeyDown) == null ? void 0 : _c.call(_b, e);
      };
    });
    __publicField(this, "getTagInputKeyUpHandler", (handleQueryListKeyUp) => {
      return (e) => {
        var _a4, _b;
        const isTargetingInput = e.target.classList.contains(classes_exports2.MULTISELECT_TAG_INPUT_INPUT);
        if (this.state.isOpen && isTargetingInput) {
          handleQueryListKeyUp == null ? void 0 : handleQueryListKeyUp(e);
        }
        (_b = (_a4 = this.props.popoverTargetProps) == null ? void 0 : _a4.onKeyDown) == null ? void 0 : _b.call(_a4, e);
      };
    });
    __publicField(this, "handleClearButtonClick", () => {
      var _a4, _b, _c;
      (_b = (_a4 = this.props).onClear) == null ? void 0 : _b.call(_a4);
      (_c = this.refHandlers.popover.current) == null ? void 0 : _c.reposition();
    });
  }
  /** @deprecated no longer necessary now that the TypeScript parser supports type arguments on JSX element tags */
  static ofType() {
    return _MultiSelect;
  }
  componentDidUpdate(prevProps) {
    var _a4, _b, _c, _d, _e;
    if (((_a4 = prevProps.tagInputProps) == null ? void 0 : _a4.inputRef) !== ((_b = this.props.tagInputProps) == null ? void 0 : _b.inputRef)) {
      setRef((_c = prevProps.tagInputProps) == null ? void 0 : _c.inputRef, null);
      this.refHandlers.input = refHandler(this, "input", (_d = this.props.tagInputProps) == null ? void 0 : _d.inputRef);
      setRef((_e = this.props.tagInputProps) == null ? void 0 : _e.inputRef, this.input);
    }
    if (prevProps.onClear === void 0 && this.props.onClear !== void 0 || prevProps.onClear !== void 0 && this.props.onClear === void 0) {
      this.forceUpdate();
    }
  }
  render() {
    const { menuProps, openOnKeyDown, popoverProps, tagInputProps, customTarget, ...restProps } = this.props;
    return (0, import_jsx_runtime2.jsx)(QueryList, { ...restProps, menuProps: {
      "aria-label": "selectable options",
      ...menuProps,
      "aria-multiselectable": true,
      id: this.listboxId
    }, onItemSelect: this.handleItemSelect, onQueryChange: this.handleQueryChange, ref: this.refHandlers.queryList, renderer: this.renderQueryList });
  }
};
__publicField(_MultiSelect, "displayName", `${DISPLAYNAME_PREFIX}.MultiSelect`);
__publicField(_MultiSelect, "defaultProps", {
  disabled: false,
  fill: false,
  placeholder: "Search..."
});
var MultiSelect = _MultiSelect;

// node_modules/@blueprintjs/select/lib/esm/components/omnibar/omnibar.js
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
var import_classnames2 = __toESM(require_classnames());
var import_react2 = __toESM(require_react());
var _Omnibar = class _Omnibar extends import_react2.PureComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "renderQueryList", (listProps) => {
      const { inputProps = {}, isOpen, overlayProps = {} } = this.props;
      const { handleKeyDown, handleKeyUp } = listProps;
      const handlers = isOpen ? { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp } : {};
      return (0, import_jsx_runtime3.jsx)(Overlay2, { hasBackdrop: true, ...overlayProps, isOpen, className: (0, import_classnames2.default)(classes_exports2.OMNIBAR_OVERLAY, overlayProps.className), onClose: this.handleOverlayClose, children: (0, import_jsx_runtime3.jsxs)("div", { className: (0, import_classnames2.default)(classes_exports2.OMNIBAR, listProps.className), ...handlers, children: [(0, import_jsx_runtime3.jsx)(InputGroup, { autoFocus: true, leftIcon: (0, import_jsx_runtime3.jsx)(Search, {}), placeholder: "Search...", size: "large", ...inputProps, onChange: listProps.handleQueryChange, value: listProps.query }), listProps.itemList] }) });
    });
    __publicField(this, "handleOverlayClose", (event) => {
      var _a4, _b, _c, _d;
      (_b = (_a4 = this.props.overlayProps) == null ? void 0 : _a4.onClose) == null ? void 0 : _b.call(_a4, event);
      (_d = (_c = this.props).onClose) == null ? void 0 : _d.call(_c, event);
    });
  }
  static ofType() {
    return _Omnibar;
  }
  render() {
    const { isOpen, inputProps, overlayProps, ...restProps } = this.props;
    const initialContent = "initialContent" in this.props ? this.props.initialContent : null;
    return (0, import_jsx_runtime3.jsx)(QueryList, {
      ...restProps,
      // Omnibar typically does not keep track of and/or show its selection state like other
      // select components, so it's more of a menu than a listbox. This means that users should return
      // MenuItems with roleStructure="menuitem" (the default value) in `props.itemRenderer`.
      menuProps: { role: "menu" },
      initialContent,
      renderer: this.renderQueryList
    });
  }
};
__publicField(_Omnibar, "displayName", `${DISPLAYNAME_PREFIX}.Omnibar`);
var Omnibar = _Omnibar;

// node_modules/@blueprintjs/select/lib/esm/components/select/select.js
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var import_classnames3 = __toESM(require_classnames());
var import_react3 = __toESM(require_react());
var _a2;
var _Select = class _Select extends AbstractPureComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { isOpen: false });
    __publicField(this, "inputElement", null);
    __publicField(this, "queryList", null);
    __publicField(this, "previousFocusedElement");
    __publicField(this, "handleInputRef", refHandler(this, "inputElement", (_a2 = this.props.inputProps) == null ? void 0 : _a2.inputRef));
    __publicField(this, "handleQueryListRef", (ref) => this.queryList = ref);
    __publicField(this, "listboxId", utils_exports.uniqueId("listbox"));
    __publicField(this, "renderQueryList", (listProps) => {
      const { filterable = true, disabled = false, inputProps = {}, placeholder = "Filter...", popoverContentProps = {}, popoverProps = {}, popoverRef } = this.props;
      const input = (0, import_jsx_runtime4.jsx)(InputGroup, { "aria-activedescendant": listProps.activeItemId, "aria-autocomplete": "list", "aria-expanded": this.state.isOpen, leftIcon: (0, import_jsx_runtime4.jsx)(Search, {}), placeholder, rightElement: this.maybeRenderClearButton(listProps.query), role: "combobox", ...inputProps, inputRef: this.handleInputRef, onChange: listProps.handleQueryChange, value: listProps.query });
      const { handleKeyDown, handleKeyUp } = listProps;
      return (0, import_jsx_runtime4.jsx)(Popover, { autoFocus: false, enforceFocus: false, isOpen: this.state.isOpen, disabled, placement: popoverProps.position || popoverProps.placement ? void 0 : "bottom-start", ...popoverProps, className: (0, import_classnames3.default)(listProps.className, popoverProps.className), content: (0, import_jsx_runtime4.jsxs)("div", { ...popoverContentProps, onKeyDown: handleKeyDown, onKeyUp: handleKeyUp, children: [filterable ? input : void 0, listProps.itemList] }), onClosing: this.handlePopoverClosing, onInteraction: this.handlePopoverInteraction, onOpened: this.handlePopoverOpened, onOpening: this.handlePopoverOpening, popoverClassName: (0, import_classnames3.default)(classes_exports2.SELECT_POPOVER, popoverProps.popoverClassName), popupKind: PopupKind.LISTBOX, ref: popoverRef, renderTarget: this.getPopoverTargetRenderer(listProps, this.state.isOpen) });
    });
    // We use the renderTarget API to flatten the rendered DOM and make it easier to implement features like
    // the "fill" prop. Note that we must take `isOpen` as an argument to force this render function to be called
    // again after that state changes.
    __publicField(this, "getPopoverTargetRenderer", (listProps, isOpen) => (
      // N.B. pull out `isOpen` so that it's not forwarded to the DOM, but remember not to use it directly
      // since it may be stale (`renderTarget` is not re-invoked on this.state changes).
      // eslint-disable-next-line react/display-name
      ({ isOpen: _isOpen, ref, ...targetProps }) => {
        const { disabled, filterable = true, popoverProps = {}, popoverTargetProps } = this.props;
        const { handleKeyDown, handleKeyUp } = listProps;
        const { targetTagName = "div" } = popoverProps;
        return (0, import_react3.createElement)(targetTagName, {
          "aria-controls": this.listboxId,
          ...popoverTargetProps,
          ...targetProps,
          "aria-disabled": disabled,
          "aria-expanded": isOpen,
          // When filterable, the InputGroup inside is the combobox; this trigger is just a button
          // When not filterable, this trigger is the combobox
          ...filterable ? { "aria-haspopup": "listbox" } : {},
          // Note that we must set FILL here in addition to children to get the wrapper element to full width
          className: (0, import_classnames3.default)(targetProps.className, popoverTargetProps == null ? void 0 : popoverTargetProps.className, {
            [classes_exports.FILL]: this.props.fill
          }),
          // Normally, Popover would also need to attach its own `onKeyDown` handler via `targetProps`,
          // but in our case we fully manage that interaction and listen for key events to open/close
          // the popover, so we elide it from the DOM.
          onKeyDown: this.withPopoverTargetPropsHandler("keydown", isOpen ? handleKeyDown : this.handleTargetKeyDown),
          onKeyUp: this.withPopoverTargetPropsHandler("keyup", isOpen ? handleKeyUp : void 0),
          ref,
          role: filterable ? void 0 : "combobox"
        }, this.props.children);
      }
    ));
    __publicField(this, "withPopoverTargetPropsHandler", (eventType, handler) => {
      switch (eventType) {
        case "keydown":
          return (event) => {
            var _a4, _b;
            handler == null ? void 0 : handler(event);
            (_b = (_a4 = this.props.popoverTargetProps) == null ? void 0 : _a4.onKeyDown) == null ? void 0 : _b.call(_a4, event);
          };
        case "keyup":
          return (event) => {
            var _a4, _b;
            handler == null ? void 0 : handler(event);
            (_b = (_a4 = this.props.popoverTargetProps) == null ? void 0 : _a4.onKeyUp) == null ? void 0 : _b.call(_a4, event);
          };
      }
    });
    /**
     * Target wrapper element "keydown" handler while the popover is closed.
     */
    __publicField(this, "handleTargetKeyDown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        this.setState({ isOpen: true });
      } else if (utils_exports.isKeyboardClick(event)) {
        this.setState({ isOpen: true });
      }
    });
    __publicField(this, "handleItemSelect", (item, event) => {
      var _a4, _b;
      const target = event == null ? void 0 : event.target;
      const menuItem = target == null ? void 0 : target.closest(`.${classes_exports.MENU_ITEM}`);
      const menuItemDismiss = menuItem == null ? void 0 : menuItem.matches(`.${classes_exports.POPOVER_DISMISS}`);
      const shouldDismiss = menuItemDismiss ?? true;
      this.setState({ isOpen: !shouldDismiss });
      (_b = (_a4 = this.props).onItemSelect) == null ? void 0 : _b.call(_a4, item, event);
    });
    __publicField(this, "handlePopoverInteraction", (isOpen, event) => {
      var _a4, _b;
      this.setState({ isOpen });
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onInteraction) == null ? void 0 : _b.call(_a4, isOpen, event);
    });
    __publicField(this, "handlePopoverOpening", (node) => {
      var _a4, _b;
      this.previousFocusedElement = utils_exports.getActiveElement(this.inputElement) ?? void 0;
      if (this.props.resetOnClose) {
        this.resetQuery();
      }
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onOpening) == null ? void 0 : _b.call(_a4, node);
    });
    __publicField(this, "handlePopoverOpened", (node) => {
      var _a4, _b;
      if (this.queryList != null) {
        this.queryList.scrollActiveItemIntoView();
      }
      this.requestAnimationFrame(() => {
        var _a5;
        const { inputProps = {} } = this.props;
        if (inputProps.autoFocus !== false) {
          (_a5 = this.inputElement) == null ? void 0 : _a5.focus();
        }
      });
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onOpened) == null ? void 0 : _b.call(_a4, node);
    });
    __publicField(this, "handlePopoverClosing", (node) => {
      var _a4, _b;
      this.requestAnimationFrame(() => {
        if (this.previousFocusedElement !== void 0) {
          this.previousFocusedElement.focus();
          this.previousFocusedElement = void 0;
        }
      });
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onClosing) == null ? void 0 : _b.call(_a4, node);
    });
    __publicField(this, "resetQuery", () => this.queryList && this.queryList.setQuery("", true));
  }
  /** @deprecated no longer necessary now that the TypeScript parser supports type arguments on JSX element tags */
  static ofType() {
    return _Select;
  }
  render() {
    const { filterable, inputProps, menuProps, popoverProps, ...restProps } = this.props;
    return (0, import_jsx_runtime4.jsx)(QueryList, { ...restProps, listId: this.listboxId, menuProps: { "aria-label": "selectable options", ...menuProps }, onItemSelect: this.handleItemSelect, ref: this.handleQueryListRef, renderer: this.renderQueryList });
  }
  componentDidUpdate(prevProps, prevState) {
    var _a4, _b, _c, _d, _e;
    if (((_a4 = prevProps.inputProps) == null ? void 0 : _a4.inputRef) !== ((_b = this.props.inputProps) == null ? void 0 : _b.inputRef)) {
      setRef((_c = prevProps.inputProps) == null ? void 0 : _c.inputRef, null);
      this.handleInputRef = refHandler(this, "inputElement", (_d = this.props.inputProps) == null ? void 0 : _d.inputRef);
      setRef((_e = this.props.inputProps) == null ? void 0 : _e.inputRef, this.inputElement);
    }
    if (this.state.isOpen && !prevState.isOpen && this.queryList != null) {
      this.queryList.scrollActiveItemIntoView();
    }
  }
  maybeRenderClearButton(query) {
    return query.length > 0 ? (0, import_jsx_runtime4.jsx)(Button, { "aria-label": "Clear filter query", icon: (0, import_jsx_runtime4.jsx)(Cross, {}), onClick: this.resetQuery, title: "Clear filter query", variant: "minimal" }) : void 0;
  }
};
__publicField(_Select, "displayName", `${DISPLAYNAME_PREFIX}.Select`);
var Select = _Select;

// node_modules/@blueprintjs/select/lib/esm/components/suggest/suggest.js
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
var import_classnames4 = __toESM(require_classnames());
var _a3;
var _Suggest = class _Suggest extends AbstractPureComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "state", {
      isOpen: this.props.popoverProps != null && this.props.popoverProps.isOpen || false,
      selectedItem: this.getInitialSelectedItem()
    });
    __publicField(this, "inputElement", null);
    __publicField(this, "queryList", null);
    __publicField(this, "handleInputRef", refHandler(this, "inputElement", (_a3 = this.props.inputProps) == null ? void 0 : _a3.inputRef));
    __publicField(this, "handleQueryListRef", (ref) => this.queryList = ref);
    __publicField(this, "listboxId", utils_exports.uniqueId("listbox"));
    __publicField(this, "renderQueryList", (listProps) => {
      const { popoverContentProps = {}, popoverProps = {}, popoverRef } = this.props;
      const { isOpen } = this.state;
      const { handleKeyDown, handleKeyUp } = listProps;
      return (0, import_jsx_runtime5.jsx)(Popover, { autoFocus: false, enforceFocus: false, isOpen, placement: popoverProps.position || popoverProps.placement ? void 0 : "bottom-start", ...popoverProps, className: (0, import_classnames4.default)(listProps.className, popoverProps.className), content: (0, import_jsx_runtime5.jsx)("div", { ...popoverContentProps, onKeyDown: handleKeyDown, onKeyUp: handleKeyUp, children: listProps.itemList }), interactionKind: "click", onInteraction: this.handlePopoverInteraction, onOpened: this.handlePopoverOpened, onOpening: this.handlePopoverOpening, popoverClassName: (0, import_classnames4.default)(classes_exports2.SUGGEST_POPOVER, popoverProps.popoverClassName), popupKind: PopupKind.LISTBOX, ref: popoverRef, renderTarget: this.getPopoverTargetRenderer(listProps, isOpen) });
    });
    // We use the renderTarget API to flatten the rendered DOM and make it easier to implement features like
    // the "fill" prop. Note that we must take `isOpen` as an argument to force this render function to be called
    // again after that state changes.
    __publicField(this, "getPopoverTargetRenderer", (listProps, isOpen) => (
      // eslint-disable-next-line react/display-name
      ({
        // pull out `isOpen` so that it's not forwarded to the DOM
        isOpen: _isOpen,
        ref,
        ...targetProps
      }) => {
        const { disabled, fill, inputProps = {}, inputValueRenderer, popoverProps = {}, resetOnClose } = this.props;
        const { selectedItem } = this.state;
        const { handleKeyDown, handleKeyUp } = listProps;
        const selectedItemText = selectedItem == null ? "" : inputValueRenderer(selectedItem);
        const { autoComplete = "off", placeholder = "Search..." } = inputProps;
        const inputPlaceholder = isOpen && selectedItemText ? selectedItemText : placeholder;
        const inputValue = isOpen ? listProps.query : selectedItemText === "" ? resetOnClose ? "" : listProps.query : selectedItemText;
        return (0, import_jsx_runtime5.jsx)(InputGroup, { "aria-controls": this.listboxId, autoComplete, disabled, tagName: popoverProps.targetTagName, ...targetProps, ...inputProps, "aria-autocomplete": "list", "aria-expanded": isOpen, className: (0, import_classnames4.default)(targetProps.className, inputProps.className), fill, inputRef: mergeRefs(this.handleInputRef, ref), onChange: listProps.handleQueryChange, onFocus: this.handleInputFocus, onKeyDown: this.getTargetKeyDownHandler(handleKeyDown), onKeyUp: this.getTargetKeyUpHandler(handleKeyUp), placeholder: inputPlaceholder, role: "combobox", value: inputValue });
      }
    ));
    __publicField(this, "selectText", () => {
      this.requestAnimationFrame(() => {
        var _a4;
        (_a4 = this.inputElement) == null ? void 0 : _a4.setSelectionRange(0, this.inputElement.value.length);
      });
    });
    __publicField(this, "handleInputFocus", (event) => {
      var _a4, _b;
      this.selectText();
      if (!this.props.openOnKeyDown) {
        this.setState({ isOpen: true });
      }
      (_b = (_a4 = this.props.inputProps) == null ? void 0 : _a4.onFocus) == null ? void 0 : _b.call(_a4, event);
    });
    __publicField(this, "handleItemSelect", (item, event) => {
      var _a4, _b, _c, _d;
      let nextOpenState;
      if (!this.props.closeOnSelect) {
        (_a4 = this.inputElement) == null ? void 0 : _a4.focus();
        this.selectText();
        nextOpenState = true;
      } else {
        (_b = this.inputElement) == null ? void 0 : _b.blur();
        nextOpenState = false;
      }
      if (this.props.selectedItem === void 0) {
        this.setState({
          isOpen: nextOpenState,
          selectedItem: item
        });
      } else {
        this.setState({ isOpen: nextOpenState });
      }
      (_d = (_c = this.props).onItemSelect) == null ? void 0 : _d.call(_c, item, event);
    });
    // Popover interaction kind is CLICK, so this only handles click events.
    // Note that we defer to the next animation frame in order to get the latest activeElement
    __publicField(this, "handlePopoverInteraction", (nextOpenState, event) => this.requestAnimationFrame(() => {
      var _a4, _b;
      const isInputFocused = this.inputElement === utils_exports.getActiveElement(this.inputElement);
      if (this.inputElement != null && !isInputFocused) {
        this.setState({ isOpen: false });
      }
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onInteraction) == null ? void 0 : _b.call(_a4, nextOpenState, event);
    }));
    __publicField(this, "handlePopoverOpening", (node) => {
      var _a4, _b;
      if (this.props.resetOnClose && this.queryList) {
        this.queryList.setQuery("", true);
      }
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onOpening) == null ? void 0 : _b.call(_a4, node);
    });
    __publicField(this, "handlePopoverOpened", (node) => {
      var _a4, _b;
      if (this.queryList != null) {
        this.queryList.scrollActiveItemIntoView();
      }
      (_b = (_a4 = this.props.popoverProps) == null ? void 0 : _a4.onOpened) == null ? void 0 : _b.call(_a4, node);
    });
    __publicField(this, "getTargetKeyDownHandler", (handleQueryListKeyDown) => {
      return (e) => {
        var _a4, _b, _c;
        if (e.key === "Escape" || e.key === "Tab") {
          if (e.key === "Escape") {
            (_a4 = this.inputElement) == null ? void 0 : _a4.blur();
          }
          this.setState({ isOpen: false });
        } else if (this.props.openOnKeyDown && e.key !== "Backspace" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
          this.setState({ isOpen: true });
        }
        if (this.state.isOpen) {
          handleQueryListKeyDown == null ? void 0 : handleQueryListKeyDown(e);
        }
        (_c = (_b = this.props.inputProps) == null ? void 0 : _b.onKeyDown) == null ? void 0 : _c.call(_b, e);
      };
    });
    __publicField(this, "getTargetKeyUpHandler", (handleQueryListKeyUp) => {
      return (evt) => {
        var _a4, _b;
        if (this.state.isOpen) {
          handleQueryListKeyUp == null ? void 0 : handleQueryListKeyUp(evt);
        }
        (_b = (_a4 = this.props.inputProps) == null ? void 0 : _a4.onKeyUp) == null ? void 0 : _b.call(_a4, evt);
      };
    });
  }
  /** @deprecated no longer necessary now that the TypeScript parser supports type arguments on JSX element tags */
  static ofType() {
    return _Suggest;
  }
  render() {
    const { disabled, inputProps, menuProps, popoverProps, ...restProps } = this.props;
    return (0, import_jsx_runtime5.jsx)(QueryList, { ...restProps, menuProps: { "aria-label": "selectable options", ...menuProps, id: this.listboxId }, initialActiveItem: this.props.selectedItem ?? void 0, onItemSelect: this.handleItemSelect, ref: this.handleQueryListRef, renderer: this.renderQueryList });
  }
  componentDidUpdate(prevProps, prevState) {
    var _a4, _b, _c, _d, _e, _f;
    if (((_a4 = prevProps.inputProps) == null ? void 0 : _a4.inputRef) !== ((_b = this.props.inputProps) == null ? void 0 : _b.inputRef)) {
      setRef((_c = prevProps.inputProps) == null ? void 0 : _c.inputRef, null);
      this.handleInputRef = refHandler(this, "inputElement", (_d = this.props.inputProps) == null ? void 0 : _d.inputRef);
      setRef((_e = this.props.inputProps) == null ? void 0 : _e.inputRef, this.inputElement);
    }
    if (this.props.selectedItem !== void 0 && this.props.selectedItem !== this.state.selectedItem) {
      this.setState({ selectedItem: this.props.selectedItem });
    }
    if (this.state.isOpen === false && prevState.isOpen === true) {
      const timeout = ((_f = this.props.popoverProps) == null ? void 0 : _f.transitionDuration) ?? Popover.defaultProps.transitionDuration;
      setTimeout(() => this.maybeResetActiveItemToSelectedItem(), timeout);
    }
    if (this.state.isOpen && !prevState.isOpen && this.queryList != null) {
      this.queryList.scrollActiveItemIntoView();
    }
  }
  getInitialSelectedItem() {
    if (this.props.selectedItem !== void 0) {
      return this.props.selectedItem;
    } else if (this.props.defaultSelectedItem !== void 0) {
      return this.props.defaultSelectedItem;
    } else {
      return null;
    }
  }
  maybeResetActiveItemToSelectedItem() {
    const shouldResetActiveItemToSelectedItem = this.props.activeItem === void 0 && this.state.selectedItem !== null && !this.props.resetOnSelect;
    if (this.queryList !== null && shouldResetActiveItemToSelectedItem) {
      this.queryList.setActiveItem(this.props.selectedItem ?? this.state.selectedItem);
    }
  }
};
__publicField(_Suggest, "displayName", `${DISPLAYNAME_PREFIX}.Suggest`);
__publicField(_Suggest, "defaultProps", {
  closeOnSelect: true,
  fill: false,
  openOnKeyDown: false,
  resetOnClose: false
});
var Suggest = _Suggest;
export {
  classes_exports2 as Classes,
  MultiSelect,
  MultiSelect as MultiSelect2,
  Omnibar,
  QueryList,
  Select,
  Select as Select2,
  Suggest,
  Suggest as Suggest2,
  executeItemsEqual,
  getActiveItem,
  getCreateNewItem,
  isCreateNewItem,
  renderFilteredItems
};
//# sourceMappingURL=@blueprintjs_select.js.map
