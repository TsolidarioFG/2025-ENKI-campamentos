import prisma from "../lib/prisma.js";

const SYSTEM_DISCOUNT_CODES = ["REPEAT", "SCHOOL", "SIBLING"];

export const getDiscounts = async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: {
        id: "desc",
      },
    });
    return res.json(discounts);
  } catch (error) {
    console.error("Error al obtener descuentos:", error);
    return res.status(500).json({
      error: error.message || "Error al obtener descuentos",
    });
  }
};
export const getDiscountById = async (req, res) => {
try {
    const {discountId} = req.validatedParams;
    const discount = await prisma.discount.findUnique({
      where: {id: discountId},
    });
    if (!discount) {
      return res.status(404).json({
        error: "Descuento no encontrado",
      });
    }
    return res.json(discount);
    
}catch (error){
    console.error("Error al obtener descuento:", error);
    return res.status(500).json({
      error: error.message || "Error al obtener descuento",
    });
  }
}
export const createDiscount = async (req, res) => {
try {
    let {
      code, 
      question, 
      percentage, 
      isActive, 
      notes, 
    } = req.validatedBody 

    const discount = await prisma.discount.create({
      data:{
        code,
        question,
        percentage,
        isActive: isActive ?? true,
        notes:notes || null,
    }
    })
  
    return res.status(201).json({
      message: "Descuento creado correctamente",
      discount,
    })
}catch (error){
    console.error("Error al crear descuento:", error);
    return res.status(500).json({
      error: error.message || "Error al crear descuento",
    });
  }
}
export const updateDiscount = async (req, res) => {
try {
    let { discountId } = req.validatedParams;
    let {
      code, 
      question, 
      percentage, 
      isActive, 
      notes, 
    } = req.validatedBody;

    const existingDiscount = await prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!existingDiscount) {
      return res.status(404).json({
        error: "Descuento no encontrado",
      });
    }

    if (code && code !== existingDiscount.code) {
      const codeInUse = await prisma.discount.findUnique({
        where: { code },
      });

      if (codeInUse) {
        return res.status(409).json({
          error: "Ya existe otro descuento con ese código",
        });
      }
    }
    
    if(SYSTEM_DISCOUNT_CODES.includes(existingDiscount.code)){
      if(isActive === false) return res.status(400).json({error: "No  se puede desactivar este descuento",});
      if(code !== undefined && code!=existingDiscount.code) return res.status(400).json({error: "No  se puede cambiar el código de este descuento",});
      if(question !== undefined && question!=existingDiscount.question) return res.status(400).json({error: "No  se puede cambiar la pregunta de este descuento",});
    }
  
    const updatedDiscount = await prisma.discount.update({
        where: { id: discountId },
        data: {
          code:code !== undefined ? code : existingDiscount.code,
          question:question!== undefined ? question : existingDiscount.question,
          percentage:percentage!== undefined ? percentage : existingDiscount.percentage,
          isActive: isActive!== undefined ? isActive : existingDiscount.isActive,
          notes: notes!== undefined ? notes : existingDiscount.notes,
        },
      });
    
    return res.json({
      message: "Descuento actualizado correctamente",
      discount: updatedDiscount,
    });
}catch (error){
    console.error("Error al actualizar descuento:", error);
    return res.status(500).json({
      error: error.message || "Error al actualizar descuento",
    });
  }
}

export const deleteDiscount = async (req, res) => {
try {
    let {
      discountId
    } = req.validatedParams;

    const existingDiscount = await prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!existingDiscount) {
      return res.status(404).json({
        error: "Descuento no encontrado",
      });
    }
    if(SYSTEM_DISCOUNT_CODES.includes(existingDiscount.code)){
       const updatedSystemDiscount = await prisma.discount.update({
        where: { id: discountId },
        data: {
          percentage: 0,
          isActive: true,
        },
      });

      return res.json({
        message: "El descuento del sistema no se puede desactivar. Se ha puesto su porcentaje a 0.",
        discount: updatedSystemDiscount,
      });
    }
    
    const inactiveDiscount = await prisma.discount.update({
        where: { id: discountId },
        data: {
          isActive: false,
          
        },
      });
    
    return res.json({
      message: "Descuento desactivado correctamente",
      discount: inactiveDiscount,
    });
}catch (error){
    console.error("Error al desactivar descuento:", error);
    return res.status(500).json({
      error: error.message || "Error al desactivar descuento",
    });
  }
}