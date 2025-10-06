// Функции транслитерации

export function transliterateToRussian(text) {
  const translitMap = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'yo': 'ё', 'zh': 'ж',
    'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
    'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'kh': 'х', 'ts': 'ц',
    'ch': 'ч', 'sh': 'ш', 'sch': 'щ', '': 'ъ', 'y': 'ы', '': 'ь', 'e': 'э', 'yu': 'ю',
    'ya': 'я', 'ye': 'е', 'yi': 'й', 'h': 'х', 'c': 'к', 'w': 'в', 'q': 'к',
    'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'E': 'Е', 'Yo': 'Ё', 'Zh': 'Ж',
    'Z': 'З', 'I': 'И', 'Y': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
    'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У', 'F': 'Ф', 'Kh': 'Х', 'Ts': 'Ц',
    'Ch': 'Ч', 'Sh': 'Ш', 'Sch': 'Щ', '': 'Ъ', 'Y': 'Ы', '': 'Ь', 'E': 'Э', 'Yu': 'Ю',
    'Ya': 'Я', 'Ye': 'Е', 'Yi': 'Й', 'H': 'Х', 'C': 'К', 'W': 'В', 'Q': 'К'
  };

  return text.replace(/yo|zh|kh|ts|ch|sh|sch|y|ye|yi|a|b|v|g|d|e|f|h|i|k|l|m|n|o|p|r|s|t|u|w|q|y|z/gi, match => {
    return translitMap[match.toLowerCase()] || match;
  });
}

export function transliterateToEnglish(text) {
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
    'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => translitMap[char] || char).join('');
}

// Расширенные варианты транслитерации
export function generateTransliterations(text) {
  const results = new Set([text]);

  // Базовые транслитерации
  if (/[а-яё]/i.test(text)) {
    results.add(transliterateToEnglish(text));
  }

  if (/[a-z]/i.test(text)) {
    results.add(transliterateToRussian(text));
  }

  return Array.from(results);
}
