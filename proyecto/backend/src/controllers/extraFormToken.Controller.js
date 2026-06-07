import prisma from "../lib/prisma.js";
import { generateSecureToken } from "../utils/token.js";

export const createExtraFormToken = async (req, res) => {
  try {
    const { participantId } = req.params;
    const parsedParticipantId = Number(participantId);

    const participant = await prisma.participant.findUnique({
      where: { id: parsedParticipantId },
      include: {
        guardian: true,
        extraForm: true,
      },
    });

    if (!participant) {
      return res.status(404).json({
        error: "Participante no encontrado",
      });
    }

    if (!participant.extraForm) {
      return res.status(409).json({
        error: "El participante no tiene ExtraForm asociado",
      });
    }

    const token = generateSecureToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const createdToken = await prisma.extraFormToken.create({
      data: {
        token,
        participantId: parsedParticipantId,
        expiresAt,
      },
    });

    return res.status(201).json({
      message: "Token de ExtraForm creado correctamente",
      token: createdToken.token,
      expiresAt: createdToken.expiresAt,
    });
  } catch (error) {
    console.error("Error al crear token ExtraForm:", error);

    return res.status(500).json({
      error: error.message || "Error al crear token ExtraForm",
    });
  }
};

export const getExtraFormByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const foundToken = await prisma.extraFormToken.findUnique({
      where: { token },
      include: {
        participant: {
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
        },
      },
    });

    if (!foundToken) {
      return res.status(404).json({
        error: "Enlace no válido",
      });
    }

    if (foundToken.expiresAt && new Date() > foundToken.expiresAt) {
      return res.status(410).json({
        error: "El enlace ha caducado",
      });
    }

    if (!foundToken.participant.extraForm) {
      return res.status(404).json({
        error: "El participante no tiene ExtraForm",
      });
    }

    return res.json({
      participant: {
        id: foundToken.participant.id,
        name: foundToken.participant.name,
        surname: foundToken.participant.surname,
      },
      extraForm: foundToken.participant.extraForm,
    });
  } catch (error) {
    console.error("Error al obtener ExtraForm por token:", error);

    return res.status(500).json({
      error: error.message || "Error al obtener ExtraForm",
    });
  }
};

export const updateExtraFormByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const foundToken = await prisma.extraFormToken.findUnique({
      where: { token },
      include: {
        participant: {
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
        },
      },
    });

    if (!foundToken) {
      return res.status(404).json({
        error: "Enlace no válido",
      });
    }

    if (foundToken.expiresAt && new Date() > foundToken.expiresAt) {
      return res.status(410).json({
        error: "El enlace ha caducado",
      });
    }

    const participant = foundToken.participant;

    if (!participant.extraForm) {
      return res.status(404).json({
        error: "El participante no tiene ExtraForm",
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
      disability,
      sports,
      fears,
      communication,
      foodSensitivities,
    } = req.body;

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
        where: { id: participant.extraForm.id },
        data: extraFormData,
      });

      if (
        disability &&
        typeof disability === "object" &&
        !Array.isArray(disability)
      ) {
        if (participant.extraForm.disability) {
          await tx.disability.update({
            where: { id: participant.extraForm.disability.id },
            data: {
              ...(disability.functionalDiversity !== undefined && {
                functionalDiversity: disability.functionalDiversity,
              }),
              ...(disability.disabilityDegree !== undefined && {
                disabilityDegree: disability.disabilityDegree,
              }),
              ...(disability.dependencyDegree !== undefined && {
                dependencyDegree: disability.dependencyDegree,
              }),
              ...(disability.wheelchair !== undefined && {
                wheelchair: disability.wheelchair,
              }),
              ...(disability.mobilityAid !== undefined && {
                mobilityAid: disability.mobilityAid,
              }),
              ...(disability.walking !== undefined && {
                walking: disability.walking,
              }),
              ...(disability.running !== undefined && {
                running: disability.running,
              }),
              ...(disability.climbing !== undefined && {
                climbing: disability.climbing,
              }),
              ...(disability.crawling !== undefined && {
                crawling: disability.crawling,
              }),
              ...(disability.jumping !== undefined && {
                jumping: disability.jumping,
              }),
              ...(disability.stairs !== undefined && {
                stairs: disability.stairs,
              }),
              ...(disability.outdoorMobility !== undefined && {
                outdoorMobility: disability.outdoorMobility,
              }),
            },
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
        await tx.sport.deleteMany({
          where: { extraFormId: updatedExtraForm.id },
        });

        for (const item of sports) {
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

      if (Array.isArray(fears)) {
        await tx.fear.deleteMany({
          where: { extraFormId: updatedExtraForm.id },
        });

        for (const item of fears) {
          await tx.fear.create({
            data: {
              fears: item.fears || null,
              copingMechanisms: item.copingMechanisms || null,
              extraFormId: updatedExtraForm.id,
            },
          });
        }
      }

      if (Array.isArray(communication)) {
        await tx.communication.deleteMany({
          where: { extraFormId: updatedExtraForm.id },
        });

        for (const item of communication) {
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

      if (Array.isArray(foodSensitivities)) {
        await tx.foodSensitivity.deleteMany({
          where: { extraFormId: updatedExtraForm.id },
        });

        for (const item of foodSensitivities) {
          await tx.foodSensitivity.create({
            data: {
              type: item.type,
              otherText: item.otherText || null,
              extraFormId: updatedExtraForm.id,
            },
          });
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

    await prisma.extraFormToken.update({
      where: { token },
      data: {
        usedAt: new Date(),
      },
    });

    return res.json({
      message: "ExtraForm actualizado correctamente",
      extraForm: result,
    });
  } catch (error) {
    console.error("Error al actualizar ExtraForm por token:", error);

    return res.status(500).json({
      error: error.message || "Error al actualizar ExtraForm",
    });
  }
};