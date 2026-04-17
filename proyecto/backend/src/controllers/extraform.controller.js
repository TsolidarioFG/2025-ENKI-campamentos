import prisma from "../lib/prisma.js";

export const createExtraForm = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      calledBefore,
      routines,
      emotionalRegulation,
      schoolingType,
      schoolingTypeOther,
      supportType,
      hygiene,
      bladderControl,
      bowelControl,
      eatingSupport,
      feedingAdaptation,
      chokingEpisodes,
      extraInfo,
      participantId,

      disability,
      sports,
      fears,
      communication,
      foodSensitivities,
    } = req.body;

    const parsedParticipantId = Number(participantId);

    if (!Number.isInteger(parsedParticipantId) || parsedParticipantId <= 0) {
      return res.status(400).json({
        error: "participantId debe ser un entero positivo válido",
      });
    }

    const existingParticipant = await prisma.participant.findUnique({
      where: { id: parsedParticipantId },
      include: {
        extraForm: true,
      },
    });

    if (!existingParticipant) {
      return res.status(404).json({
        error: "El participante no existe",
      });
    }

    if (existingParticipant.extraForm) {
      return res.status(409).json({
        error: "Este participante ya tiene un ExtraForm creado",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdExtraForm = await tx.extraForm.create({
        data: {
          calledBefore,
          routines: routines || null,
          emotionalRegulation: emotionalRegulation || null,
          schoolingType: schoolingType || null,
          schoolingTypeOther: schoolingTypeOther || null,
          supportType: supportType || null,
          hygiene: hygiene || null,
          bladderControl: bladderControl || null,
          bowelControl: bowelControl || null,
          eatingSupport: eatingSupport || null,
          feedingAdaptation: feedingAdaptation || null,
          chokingEpisodes,
          extraInfo: extraInfo || null,
          participantId: parsedParticipantId,
        },
      });

      if (disability && typeof disability === "object" && !Array.isArray(disability)) {
        await tx.disability.create({
          data: {
            functionalDiversity: disability.functionalDiversity || null,
            disabilityDegree: disability.disabilityDegree || null,
            dependencyDegree: disability.dependencyDegree || null,
            wheelchair: disability.wheelchair,
            mobilityAid: disability.mobilityAid || null,
            walking: disability.walking || null,
            running: disability.running || null,
            climbing: disability.climbing || null,
            crawling: disability.crawling || null,
            jumping: disability.jumping || null,
            stairs: disability.stairs || null,
            outdoorMobility: disability.outdoorMobility || null,
            extraFormId: createdExtraForm.id,
          },
        });
      }

      if (Array.isArray(sports) && sports.length > 0) {
        for (const item of sports) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada sport debe ser un objeto válido");
          }

          await tx.sport.create({
            data: {
              doesSport: item.doesSport,
              favoriteSports: item.favoriteSports || null,
              swimmingLevel: item.swimmingLevel || null,
              socialPlay: item.socialPlay || null,
              playFixation: item.playFixation || null,
              extraFormId: createdExtraForm.id,
            },
          });
        }
      }

      if (Array.isArray(fears) && fears.length > 0) {
        for (const item of fears) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada fear debe ser un objeto válido");
          }

          await tx.fear.create({
            data: {
              fears: item.fears || null,
              copingMechanisms: item.copingMechanisms || null,
              extraFormId: createdExtraForm.id,
            },
          });
        }
      }

      if (Array.isArray(communication) && communication.length > 0) {
        for (const item of communication) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada communication debe ser un objeto válido");
          }

          await tx.communication.create({
            data: {
              oralLanguage: item.oralLanguage || null,
              imitation: item.imitation || null,
              writing: item.writing || null,
              comprehension: item.comprehension || null,
              reading: item.reading || null,
              alternativeCommunicationOther:
                item.alternativeCommunicationOther || null,
              comprehensionOther: item.comprehensionOther || null,
              readingOther: item.readingOther || null,
              alternativeCommunication: item.alternativeCommunication || null,
              extraFormId: createdExtraForm.id,
            },
          });
        }
      }

      if (Array.isArray(foodSensitivities) && foodSensitivities.length > 0) {
        for (const item of foodSensitivities) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada foodSensitivity debe ser un objeto válido");
          }

          await tx.foodSensitivity.create({
            data: {
              type: item.type,
              otherText: item.otherText || null,
              extraFormId: createdExtraForm.id,
            },
          });
        }
      }

      return tx.extraForm.findUnique({
        where: { id: createdExtraForm.id },
        include: {
          participant: true,
          disability: true,
          sports: true,
          fears: true,
          communication: true,
          foodSensitivities: true,
        },
      });
    });

    return res.status(201).json({
      message: "ExtraForm creado correctamente",
      extraForm: result,
    });
  } catch (error) {
    console.error("Error al crear ExtraForm:", error);

    if (
      error.message?.includes("sport") ||
      error.message?.includes("fear") ||
      error.message?.includes("communication") ||
      error.message?.includes("foodSensitivity") ||
      error.message?.includes("ya tiene un ExtraForm")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Error al crear ExtraForm",
    });
  }
};

export const getExtraFormByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    if (!Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({
        error: "participantId debe ser un entero positivo válido",
      });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        extraForm: {
          include: {
            disability: true,
            sports: true,
            fears: true,
            communication: true,
            foodSensitivities: true,
          },
        },
      },
    });

    if (!participant) {
      return res.status(404).json({
        error: "Participante no encontrado",
      });
    }

    if (!participant.extraForm) {
      return res.status(404).json({
        error: "El participante no tiene ExtraForm",
      });
    }

    return res.json(participant.extraForm);
  } catch (error) {
    console.error("Error al buscar ExtraForm:", error);

    return res.status(500).json({
      error: error.message || "Error al buscar ExtraForm",
    });
  }
};

export const updateExtraForm = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      calledBefore,
      routines,
      emotionalRegulation,
      schoolingType,
      schoolingTypeOther,
      supportType,
      hygiene,
      bladderControl,
      bowelControl,
      eatingSupport,
      feedingAdaptation,
      chokingEpisodes,
      extraInfo,
      participantId,

      disability,
      sports,
      fears,
      communication,
      foodSensitivities,
    } = req.body;

    const parsedParticipantId = Number(participantId);

    if (!Number.isInteger(parsedParticipantId) || parsedParticipantId <= 0) {
      return res.status(400).json({
        error: "participantId debe ser un entero positivo válido",
      });
    }

    const existingParticipant = await prisma.participant.findUnique({
      where: { id: parsedParticipantId },
      include: {
        extraForm: {
          include: {
            disability: true,
            sports: true,
            fears: true,
            communication: true,
            foodSensitivities: true,
          },
        },
      },
    });

    if (!existingParticipant) {
      return res.status(404).json({
        error: "El participante no existe",
      });
    }

    if (!existingParticipant.extraForm) {
      return res.status(404).json({
        error: "Este participante no tiene un ExtraForm creado",
      });
    }

    const existingExtraForm = existingParticipant.extraForm;

    const result = await prisma.$transaction(async (tx) => {
      const extraFormData = {};

      if (calledBefore !== undefined) extraFormData.calledBefore = calledBefore;
      if (routines !== undefined) extraFormData.routines = routines;
      if (emotionalRegulation !== undefined) {
        extraFormData.emotionalRegulation = emotionalRegulation;
      }
      if (schoolingType !== undefined) extraFormData.schoolingType = schoolingType;
      if (schoolingTypeOther !== undefined) {
        extraFormData.schoolingTypeOther = schoolingTypeOther;
      }
      if (supportType !== undefined) extraFormData.supportType = supportType;
      if (hygiene !== undefined) extraFormData.hygiene = hygiene;
      if (bladderControl !== undefined) extraFormData.bladderControl = bladderControl;
      if (bowelControl !== undefined) extraFormData.bowelControl = bowelControl;
      if (eatingSupport !== undefined) extraFormData.eatingSupport = eatingSupport;
      if (feedingAdaptation !== undefined) {
        extraFormData.feedingAdaptation = feedingAdaptation;
      }
      if (chokingEpisodes !== undefined) {
        extraFormData.chokingEpisodes = chokingEpisodes;
      }
      if (extraInfo !== undefined) extraFormData.extraInfo = extraInfo;

      const updatedExtraForm = await tx.extraForm.update({
        where: { id: existingExtraForm.id },
        data: extraFormData,
      });

      if (disability && typeof disability === "object" && !Array.isArray(disability)) {
        if (existingExtraForm.disability) {
          const disabilityData = {};

          if (disability.functionalDiversity !== undefined) {
            disabilityData.functionalDiversity = disability.functionalDiversity;
          }
          if (disability.disabilityDegree !== undefined) {
            disabilityData.disabilityDegree = disability.disabilityDegree;
          }
          if (disability.dependencyDegree !== undefined) {
            disabilityData.dependencyDegree = disability.dependencyDegree;
          }
          if (disability.wheelchair !== undefined) {
            disabilityData.wheelchair = disability.wheelchair;
          }
          if (disability.mobilityAid !== undefined) {
            disabilityData.mobilityAid = disability.mobilityAid;
          }
          if (disability.walking !== undefined) {
            disabilityData.walking = disability.walking;
          }
          if (disability.running !== undefined) {
            disabilityData.running = disability.running;
          }
          if (disability.climbing !== undefined) {
            disabilityData.climbing = disability.climbing;
          }
          if (disability.crawling !== undefined) {
            disabilityData.crawling = disability.crawling;
          }
          if (disability.jumping !== undefined) {
            disabilityData.jumping = disability.jumping;
          }
          if (disability.stairs !== undefined) {
            disabilityData.stairs = disability.stairs;
          }
          if (disability.outdoorMobility !== undefined) {
            disabilityData.outdoorMobility = disability.outdoorMobility;
          }

          await tx.disability.update({
            where: { id: existingExtraForm.disability.id },
            data: disabilityData,
          });
        } else {
          await tx.disability.create({
            data: {
              functionalDiversity: disability.functionalDiversity || null,
              disabilityDegree: disability.disabilityDegree || null,
              dependencyDegree: disability.dependencyDegree || null,
              wheelchair: disability.wheelchair,
              mobilityAid: disability.mobilityAid || null,
              walking: disability.walking || null,
              running: disability.running || null,
              climbing: disability.climbing || null,
              crawling: disability.crawling || null,
              jumping: disability.jumping || null,
              stairs: disability.stairs || null,
              outdoorMobility: disability.outdoorMobility || null,
              extraFormId: updatedExtraForm.id,
            },
          });
        }
      }

      if (Array.isArray(sports)) {
        for (const item of sports) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada sport debe ser un objeto válido");
          }

          if (item.id !== undefined) {
            const existingSport = await tx.sport.findFirst({
              where: {
                id: Number(item.id),
                extraFormId: updatedExtraForm.id,
              },
            });

            if (!existingSport) {
              throw new Error(`No existe sport con id ${item.id} para este ExtraForm`);
            }

            const sportData = {};
            if (item.doesSport !== undefined) sportData.doesSport = item.doesSport;
            if (item.favoriteSports !== undefined) {
              sportData.favoriteSports = item.favoriteSports;
            }
            if (item.swimmingLevel !== undefined) {
              sportData.swimmingLevel = item.swimmingLevel;
            }
            if (item.socialPlay !== undefined) {
              sportData.socialPlay = item.socialPlay;
            }
            if (item.playFixation !== undefined) {
              sportData.playFixation = item.playFixation;
            }

            await tx.sport.update({
              where: { id: Number(item.id) },
              data: sportData,
            });
          } else {
            await tx.sport.create({
              data: {
                doesSport: item.doesSport,
                favoriteSports: item.favoriteSports || null,
                swimmingLevel: item.swimmingLevel || null,
                socialPlay: item.socialPlay || null,
                playFixation: item.playFixation || null,
                extraFormId: updatedExtraForm.id,
              },
            });
          }
        }
      }

      if (Array.isArray(fears)) {
        for (const item of fears) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada fear debe ser un objeto válido");
          }

          if (item.id !== undefined) {
            const existingFear = await tx.fear.findFirst({
              where: {
                id: Number(item.id),
                extraFormId: updatedExtraForm.id,
              },
            });

            if (!existingFear) {
              throw new Error(`No existe fear con id ${item.id} para este ExtraForm`);
            }

            const fearData = {};
            if (item.fears !== undefined) fearData.fears = item.fears;
            if (item.copingMechanisms !== undefined) {
              fearData.copingMechanisms = item.copingMechanisms;
            }

            await tx.fear.update({
              where: { id: Number(item.id) },
              data: fearData,
            });
          } else {
            await tx.fear.create({
              data: {
                fears: item.fears || null,
                copingMechanisms: item.copingMechanisms || null,
                extraFormId: updatedExtraForm.id,
              },
            });
          }
        }
      }

      if (Array.isArray(communication)) {
        for (const item of communication) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada communication debe ser un objeto válido");
          }

          if (item.id !== undefined) {
            const existingCommunication = await tx.communication.findFirst({
              where: {
                id: Number(item.id),
                extraFormId: updatedExtraForm.id,
              },
            });

            if (!existingCommunication) {
              throw new Error(
                `No existe communication con id ${item.id} para este ExtraForm`
              );
            }

            const communicationData = {};
            if (item.oralLanguage !== undefined) {
              communicationData.oralLanguage = item.oralLanguage;
            }
            if (item.imitation !== undefined) {
              communicationData.imitation = item.imitation;
            }
            if (item.writing !== undefined) {
              communicationData.writing = item.writing;
            }
            if (item.comprehension !== undefined) {
              communicationData.comprehension = item.comprehension;
            }
            if (item.reading !== undefined) {
              communicationData.reading = item.reading;
            }
            if (item.alternativeCommunicationOther !== undefined) {
              communicationData.alternativeCommunicationOther =
                item.alternativeCommunicationOther;
            }
            if (item.comprehensionOther !== undefined) {
              communicationData.comprehensionOther = item.comprehensionOther;
            }
            if (item.readingOther !== undefined) {
              communicationData.readingOther = item.readingOther;
            }
            if (item.alternativeCommunication !== undefined) {
              communicationData.alternativeCommunication =
                item.alternativeCommunication;
            }

            await tx.communication.update({
              where: { id: Number(item.id) },
              data: communicationData,
            });
          } else {
            await tx.communication.create({
              data: {
                oralLanguage: item.oralLanguage || null,
                imitation: item.imitation || null,
                writing: item.writing || null,
                comprehension: item.comprehension || null,
                reading: item.reading || null,
                alternativeCommunicationOther:
                  item.alternativeCommunicationOther || null,
                comprehensionOther: item.comprehensionOther || null,
                readingOther: item.readingOther || null,
                alternativeCommunication: item.alternativeCommunication || null,
                extraFormId: updatedExtraForm.id,
              },
            });
          }
        }
      }

      if (Array.isArray(foodSensitivities)) {
        for (const item of foodSensitivities) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Cada foodSensitivity debe ser un objeto válido");
          }

          if (item.id !== undefined) {
            const existingFoodSensitivity = await tx.foodSensitivity.findFirst({
              where: {
                id: Number(item.id),
                extraFormId: updatedExtraForm.id,
              },
            });

            if (!existingFoodSensitivity) {
              throw new Error(
                `No existe foodSensitivity con id ${item.id} para este ExtraForm`
              );
            }

            const foodSensitivityData = {};

            if (item.type !== undefined) {
              foodSensitivityData.type = item.type;
            }

            if (item.otherText !== undefined) {
              foodSensitivityData.otherText = item.otherText;
            }

            await tx.foodSensitivity.update({
              where: { id: Number(item.id) },
              data: foodSensitivityData,
            });
          } else {
            await tx.foodSensitivity.create({
              data: {
                type: item.type,
                otherText: item.otherText || null,
                extraFormId: updatedExtraForm.id,
              },
            });
          }
        }
      }

      return tx.extraForm.findUnique({
        where: { id: updatedExtraForm.id },
        include: {
          participant: true,
          disability: true,
          sports: true,
          fears: true,
          communication: true,
          foodSensitivities: true,
        },
      });
    });

    return res.status(200).json({
      message: "ExtraForm actualizado correctamente",
      extraForm: result,
    });
  } catch (error) {
    console.error("Error al actualizar ExtraForm:", error);

    if (
      error.message?.includes("sport") ||
      error.message?.includes("fear") ||
      error.message?.includes("communication") ||
      error.message?.includes("foodSensitivity") ||
      error.message?.includes("no tiene un ExtraForm")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Error al actualizar ExtraForm",
    });
  }
};
export const deleteExtraFormByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    if (!Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({
        error: "participantId debe ser un entero positivo válido",
      });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        extraForm: {
          include: {
            disability: true,
            sports: true,
            fears: true,
            communication: true,
            foodSensitivities: true,
          },
        },
      },
    });

    if (!participant || !participant.extraForm) {
      return res.status(404).json({
        error: "El participante no tiene ExtraForm",
      });
    }

    const extraForm = participant.extraForm;

    await prisma.$transaction(async (tx) => {
      await tx.foodSensitivity.deleteMany({
        where: { extraFormId: extraForm.id },
      });

      await tx.sport.deleteMany({
        where: { extraFormId: extraForm.id },
      });

      await tx.fear.deleteMany({
        where: { extraFormId: extraForm.id },
      });

      await tx.communication.deleteMany({
        where: { extraFormId: extraForm.id },
      });

      await tx.extraForm.delete({
        where: { id: extraForm.id },
      });

      if (extraForm.disability) {
        await tx.disability.delete({
          where: { id: extraForm.disability.id },
        });
      }
    });

    return res.json({
      message: "ExtraForm eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar ExtraForm:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar ExtraForm",
    });
  }
};
export const deleteDisabilityByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        extraForm: {
          include: {
            disability: true,
          },
        },
      },
    });

    if (!participant || !participant.extraForm || !participant.extraForm.disability) {
      return res.status(404).json({
        error: "No existe disability para ese participante",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.extraForm.update({
        where: { id: participant.extraForm.id },
        data: {
          disabilityId: null,
        },
      });

      await tx.disability.delete({
        where: { id: participant.extraForm.disability.id },
      });
    });

    return res.json({
      message: "Disability eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar disability:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar disability",
    });
  }
};
export const deleteSportById = async (req, res) => {
  try {
    let { sportId } = req.params;
    sportId = Number(sportId);

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
    });

    if (!sport) {
      return res.status(404).json({
        error: "Sport no encontrado",
      });
    }

    await prisma.sport.delete({
      where: { id: sportId },
    });

    return res.json({
      message: "Sport eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar sport:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar sport",
    });
  }
};
export const deleteAllSportsByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { extraForm: true },
    });

    if (!participant || !participant.extraForm) {
      return res.status(404).json({
        error: "ExtraForm no encontrado",
      });
    }

    await prisma.sport.deleteMany({
      where: { extraFormId: participant.extraForm.id },
    });

    return res.json({
      message: "Lista de sports eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar sports:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar sports",
    });
  }
};
export const deleteFearById = async (req, res) => {
  try {
    let { fearId } = req.params;
    fearId = Number(fearId);

    const fear = await prisma.fear.findUnique({
      where: { id: fearId },
    });

    if (!fear) {
      return res.status(404).json({
        error: "Fear no encontrado",
      });
    }

    await prisma.fear.delete({
      where: { id: fearId },
    });

    return res.json({
      message: "Fear eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar fear:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar fear",
    });
  }
};
export const deleteAllFearsByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { extraForm: true },
    });

    if (!participant || !participant.extraForm) {
      return res.status(404).json({
        error: "ExtraForm no encontrado",
      });
    }

    await prisma.fear.deleteMany({
      where: { extraFormId: participant.extraForm.id },
    });

    return res.json({
      message: "Lista de fears eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar fears:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar fears",
    });
  }
};
export const deleteCommunicationById = async (req, res) => {
  try {
    let { communicationId } = req.params;
    communicationId = Number(communicationId);

    const communication = await prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!communication) {
      return res.status(404).json({
        error: "Communication no encontrado",
      });
    }

    await prisma.communication.delete({
      where: { id: communicationId },
    });

    return res.json({
      message: "Communication eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar communication:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar communication",
    });
  }
};
export const deleteAllCommunicationByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { extraForm: true },
    });

    if (!participant || !participant.extraForm) {
      return res.status(404).json({
        error: "ExtraForm no encontrado",
      });
    }

    await prisma.communication.deleteMany({
      where: { extraFormId: participant.extraForm.id },
    });

    return res.json({
      message: "Lista de communication eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar communication:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar communication",
    });
  }
};
export const deleteFoodSensitivityById = async (req, res) => {
  try {
    let { foodSensitivityId } = req.params;
    foodSensitivityId = Number(foodSensitivityId);

    const item = await prisma.foodSensitivity.findUnique({
      where: { id: foodSensitivityId },
    });

    if (!item) {
      return res.status(404).json({
        error: "FoodSensitivity no encontrada",
      });
    }

    await prisma.foodSensitivity.delete({
      where: { id: foodSensitivityId },
    });

    return res.json({
      message: "FoodSensitivity eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar foodSensitivity:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar foodSensitivity",
    });
  }
};
export const deleteAllFoodSensitivitiesByParticipantId = async (req, res) => {
  try {
    let { participantId } = req.params;
    participantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { extraForm: true },
    });

    if (!participant || !participant.extraForm) {
      return res.status(404).json({
        error: "ExtraForm no encontrado",
      });
    }

    await prisma.foodSensitivity.deleteMany({
      where: { extraFormId: participant.extraForm.id },
    });

    return res.json({
      message: "Lista de foodSensitivities eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar foodSensitivities:", error);
    return res.status(500).json({
      error: error.message || "Error al eliminar foodSensitivities",
    });
  }
};