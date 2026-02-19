-- CreateTable
CREATE TABLE `Producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreProducto` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL,
    `precioCosto` DOUBLE NOT NULL,
    `precioPublico` DOUBLE NOT NULL,
    `favorito` BOOLEAN NOT NULL DEFAULT false,
    `imagen` VARCHAR(191) NOT NULL,
    `categoriaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
