namespace my.bookshop;

entity Books {
  key ID      : String(10);  // instead of UUID
  title       : String(100);
  author      : String(100);
  price       : Decimal(10,2);
  stock       : Integer;
  createdAt   : DateTime
}
