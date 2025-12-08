
CREATE DATABASE SundaySupermarket;
GO
USE SundaySupermarket;
GO

-- 1 Role (không phụ thuộc bảng nào)
CREATE TABLE Role (
    Role_ID INT IDENTITY(1,1) PRIMARY KEY,
    Role_Name NVARCHAR(50) NOT NULL UNIQUE,
    CreateUser DATETIME DEFAULT GETDATE()
);
GO

-- 2 User (phụ thuộc Role)
CREATE TABLE [User] (
    User_ID INT IDENTITY(1,1) PRIMARY KEY,
    User_Name NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    Full_Name NVARCHAR(200),
    Email NVARCHAR(150) UNIQUE,
    Phone NVARCHAR(20),
    Address NVARCHAR(255),
    Avatar NVARCHAR(255),
    IsActive BIT NOT NULL DEFAULT 1,
    Role_ID INT NOT NULL,
    FOREIGN KEY (Role_ID) REFERENCES Role(Role_ID)
);
GO


 --3. Supplier
CREATE TABLE Supplier (
    Supplier_ID INT IDENTITY(1,1) PRIMARY KEY,
    Supplier_Name NVARCHAR(100) NOT NULL,
    PhoneContact NVARCHAR(20),
    Address NVARCHAR(255)
);
GO


--4. Brand
CREATE TABLE Brand (
    Brand_ID INT IDENTITY(1,1) PRIMARY KEY,
    Brand_Name NVARCHAR(100) NOT NULL UNIQUE
);
GO

--5. Category
CREATE TABLE Category (
    Category_ID INT IDENTITY(1,1) PRIMARY KEY,
    Category_Name NVARCHAR(100) NOT NULL UNIQUE,
    ParentCategoryID INT NULL,
    ImageURL NVARCHAR(255),
    FOREIGN KEY (ParentCategoryID) REFERENCES Category(Category_ID)
);
GO


 --6. Product
CREATE TABLE Product (
    Product_ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    CategoryID INT NOT NULL,
    Brand_ID INT NOT NULL,
    UnitPrice INT NOT NULL CHECK (UnitPrice >= 0),
    ImageURL NVARCHAR(255),
    FOREIGN KEY (CategoryID) REFERENCES Category(Category_ID),
    FOREIGN KEY (Brand_ID) REFERENCES Brand(Brand_ID)
);
GO

 --7. Inventory
CREATE TABLE Inventory (
    Product_ID INT PRIMARY KEY,
    Stock INT NOT NULL DEFAULT 0 CHECK (Stock >= 0),
    MinStock INT NOT NULL DEFAULT 0 CHECK (MinStock >= 0),
    LastUpdate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
GO


 -- 8. PurchaseOrder
CREATE TABLE PurchaseOrder (
    PO_ID INT IDENTITY(1,1) PRIMARY KEY,
    Supplier_ID INT NOT NULL,
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    TotalAmount INT NOT NULL DEFAULT 0,
    FOREIGN KEY (Supplier_ID) REFERENCES Supplier(Supplier_ID)
);
GO


-- 9. PurchaseOrder_Details
CREATE TABLE PurchaseOrder_Details (
    POD_ID INT IDENTITY(1,1) PRIMARY KEY,
    PO_ID INT NOT NULL,
    Product_ID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitCost INT NOT NULL CHECK (UnitCost >= 0),
    FOREIGN KEY (PO_ID) REFERENCES PurchaseOrder(PO_ID),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
GO


 --10. Stock_Transactions
CREATE TABLE Stock_Transactions (
    Transaction_ID INT IDENTITY(1,1) PRIMARY KEY,
    Product_ID INT NOT NULL,
    Type NVARCHAR(20) NOT NULL,
    Quantity INT NOT NULL,
    UnitCost INT NULL,
    Supplier_ID INT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Note NVARCHAR(255),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID),
    FOREIGN KEY (Supplier_ID) REFERENCES Supplier(Supplier_ID)
);
GO

-- 11. Feedback
CREATE TABLE Feedback (
    Feedback_ID INT IDENTITY(1,1) PRIMARY KEY,
    User_ID INT NOT NULL,
    Product_ID INT NOT NULL,
    Rating INT,
    Content NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (User_ID) REFERENCES [User](User_ID),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
GO


 -- 12. [Order]
CREATE TABLE [Order] (
    Order_ID INT IDENTITY(1,1) PRIMARY KEY,
    User_ID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount INT NOT NULL DEFAULT 0,
    Status NVARCHAR(50) NOT NULL,
    FOREIGN KEY (User_ID) REFERENCES [User](User_ID)
);
GO


 -- 13. Order_Details
CREATE TABLE Order_Details (
    ODetail_ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL,
    Product_ID INT NOT NULL,
    Quantity INT NOT NULL ,
    UnitPrice INT NOT NULL ,
	ShipAddress NVARCHAR(255) NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES [Order](Order_ID),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
GO


 -- 14. Delivery
CREATE TABLE Delivery (
    Delivery_ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL,
    User_ID INT NOT NULL,   
    Status NVARCHAR(50) NOT NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Order_ID) REFERENCES [Order](Order_ID),
    FOREIGN KEY (User_ID) REFERENCES [User](User_ID)
);
GO


 -- 15. ShoppingCart
CREATE TABLE ShoppingCart (
    Cart_ID INT IDENTITY(1,1) PRIMARY KEY,
    User_ID INT NOT NULL,
    Product_ID INT NOT NULL,
    Quantity INT NOT NULL,
    CreateAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (User_ID) REFERENCES [User](User_ID),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
GO

INSERT INTO Role (Role_Name)
VALUES 
    ('Admin'),
    ('Customer'),
    ('Shipper'),
    ('Guest');
GO




