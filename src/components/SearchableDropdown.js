import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Keyboard,
  StyleSheet
} from 'react-native'

const SearchableDropDown = ({
  items = [],
  onItemSelect,
  onTextChange,
  onChangeText,
  onFocus,
  onBlur,
  onRemoveItem,
  selectedItems = [],
  placeholder = 'Search...',
  placeholderTextColor = '#999',
  defaultIndex,
  resetValue,
  multi = false,
  chip = false,
  setSort,
  containerStyle,
  textInputStyle,
  itemStyle,
  itemTextStyle,
  itemsContainerStyle,
  textInputProps = {}
}) => {
  const [searchText, setSearchText] = useState('')
  const [listItems, setListItems] = useState(items)
  const [focus, setFocusState] = useState(false)
  const [item, setItem] = useState(
    defaultIndex && items.length > defaultIndex ? items[defaultIndex] : {}
  )
  const inputRef = useRef(null)

  useEffect(() => {
    setListItems(items)
  }, [items])

  useEffect(() => {
    if (!searchText || items === listItems) return
    const filtered = filterItems(items, searchText)
    setListItems(filtered)
    setItem({ id: -1, name: searchText })
  }, [items])

  const filterItems = useCallback(
    (list, text) => {
      const sortFn =
        setSort && typeof setSort === 'function'
          ? setSort
          : (i, t) => i.name.toLowerCase().indexOf(t.toLowerCase()) > -1
      return list.filter((i) => sortFn(i, text))
    },
    [setSort]
  )

  const handleTextChange = useCallback(
    (text) => {
      setSearchText(text)
      const filtered = filterItems(items, text)
      setItem({ id: -1, name: text })
      setListItems(filtered)

      const callback = onTextChange || onChangeText || textInputProps.onTextChange || textInputProps.onChangeText
      if (callback && typeof callback === 'function') {
        setTimeout(() => callback(text), 0)
      }
    },
    [items, filterItems, onTextChange, onChangeText, textInputProps]
  )

  const handleItemSelect = useCallback(
    (selectedItem) => {
      setItem(selectedItem)
      setFocusState(false)
      Keyboard.dismiss()
      setTimeout(() => {
        onItemSelect?.(selectedItem)
        if (resetValue) {
          setFocusState(true)
          setItem({})
          inputRef.current?.focus()
        }
      }, 0)
    },
    [onItemSelect, resetValue]
  )

  const handleFocus = useCallback(
    (e) => {
      onFocus?.(e)
      textInputProps.onFocus?.(e)
      setFocusState(true)
      setListItems(items)
    },
    [onFocus, items, textInputProps]
  )

  const handleBlur = useCallback(
    (e) => {
      onBlur?.(e)
      textInputProps.onBlur?.(e)
      setFocusState(false)
    },
    [onBlur, textInputProps]
  )

  const renderSelectedChips = () => {
    if (!selectedItems?.length || !chip || !multi) return null

    return (
      <View style={styles.chipContainer}>
        {selectedItems.map((chipItem, index) => (
          <View key={chipItem.id || index} style={styles.chip}>
            <Text style={styles.chipText}>{chipItem.name}</Text>
            <TouchableOpacity
              onPress={() => setTimeout(() => onRemoveItem?.(chipItem, index), 0)}
              style={styles.chipRemove}
              accessibilityLabel={`Remove ${chipItem.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.chipRemoveText}>{'\u00D7'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )
  }

  const renderItem = (listItem, index) => {
    const isSelected = selectedItems?.find?.((s) => s.id === listItem.id)

    if (multi && isSelected) {
      return (
        <TouchableOpacity
          key={listItem.id || index}
          style={[itemStyle, styles.itemRow]}
        >
          <View style={styles.itemContent}>
            <Text style={itemTextStyle}>{listItem.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTimeout(() => onRemoveItem?.(listItem, index), 0)}
            style={styles.removeButton}
            accessibilityLabel={`Remove ${listItem.name}`}
          >
            <Text style={styles.removeButtonText}>{'\u00D7'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        key={listItem.id || index}
        style={itemStyle}
        onPress={() => handleItemSelect(listItem)}
        accessibilityRole="button"
      >
        <Text style={itemTextStyle}>{listItem.name}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={containerStyle}>
      {renderSelectedChips()}
      <TextInput
        ref={inputRef}
        value={item?.name || ''}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={textInputStyle}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityLabel={placeholder}
        {...textInputProps}
      />
      {focus && listItems.length > 0 && (
        <View style={itemsContainerStyle}>
          {listItems.map(renderItem)}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
    marginTop: 5
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F8',
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  chipText: {
    color: '#1A2225',
    fontSize: 14,
    fontWeight: '500'
  },
  chipRemove: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 8
  },
  chipRemoveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row'
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 10
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
})

export default SearchableDropDown
