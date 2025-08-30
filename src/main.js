/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const decimalDiscount = discount / 100;

  // 2. Посчитать полную стоимость без скидки
  const fullPrice = sale_price * quantity;

  // 3. Умножить полную стоимость на (1 - десятичная скидка)
  const revenue = fullPrice * (1 - decimalDiscount);

  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  if (index === 0) { // Первое место
    return profit * 0.15;
  } else if (index === 1 || index === 2) { // Второе и третье место
    return profit * 0.1;
  } else if (index === total - 1) { // Все кроме последнего
    return 0;
  } else { // Последнее место
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Проверка входных данных

  if (!data
    || !Array.isArray(data.sellers)
    || !Array.isArray(data.customers)
    || !Array.isArray(data.products)
    || !Array.isArray(data.purchase_records)
    || data.sellers.length === 0
    || data.customers.length === 0
    || data.products.length === 0
    || data.purchase_records.length === 0
  ) {
    throw new Error('Некорректные входные данные');
  }
  // @TODO: Проверка наличия опций
  if (!options) {
    throw new Error('Опции не предоставлены');
  }

  if (typeof options !== 'object' || options === null) {
    throw new Error('Опции должны быть объектом');
  }
  if (!calculateRevenue || !calculateBonus) {
    throw new Error('Отсутствуют обязательные функции в опциях');
  }

  if (typeof calculateRevenue !== 'function') {
    throw new Error('calculateRevenue должна быть функцией');
  }

  if (typeof calculateBonus !== 'function') {
    throw new Error('calculateBonus должна быть функцией');
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики 
  const sellerStats = data.sellers.map(seller => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
    bonus: 0
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = Object.fromEntries(
    sellerStats.map(seller => [seller.id, seller])
  );

  const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
  );

  data.purchase_records.forEach(record => {

    const seller = sellerIndex[record.seller_id];

    seller.sales_count += 1;

    seller.revenue += record.total_amount;

    record.items.forEach(item => {
      const product = productIndex[item.sku];

      const cost = product.purchase_price * item.quantity;

      const revenue = calculateRevenue(item, product);

      seller.profit += revenue - cost;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;

    });

  });

  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    let total = sellerStats.length;
    seller.bonus = calculateBonus(index, total, seller);
    seller.top_products = Object.entries(seller.products_sold || {})
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b - a)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  const result = sellerStats.map(seller => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2)
  }));

  return result;

}

