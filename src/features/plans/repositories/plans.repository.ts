/**
 * Plans Repository
 * 
 * This repository handles database operations for plan-related models:
 * - plan (treatment plans)
 * - patient_plan 
 * - patient_plan_schedule
 * - patient_plan_schedule_log
 */

import prismaPostgres from '@/db/postgres/client';
import { Prisma } from '@/db/postgres/generated/postgres-client';
import { 
  CreatePlanData, 
  UpdatePlanData, 
  PlanFilters,
  CreatePatientPlanData,
  UpdatePatientPlanData,
  PatientPlanFilters,
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleFilters,
  CreateScheduleLogData,
  UpdateScheduleLogData,
  ScheduleLogFilters
} from '../dto/plans.dto';

export class PlansRepository {
  private db = prismaPostgres;

  // ===================================================================
  // 🎯 PLAN (TREATMENT PLAN) OPERATIONS
  // ===================================================================

  /**
   * Create a new treatment plan
   */
  async createPlan(data: CreatePlanData & { clientId: number; crUser: string; modUser: string }) {
    return await this.db.plan.create({
      data: {
        ...data,
        crDate: new Date(),
        modDate: new Date(),
      }
    });
  }

  /**
   * Get treatment plans with filters and pagination
   */
  async getPlans(filters: PlanFilters, clientId: number) {
    const {
      page = 1,
      limit = 10,
      search,
      diagnosisId,
      diagnosisName,
      version,
      sort = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.planWhereInput = {
      clientId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { diagnosisName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(diagnosisId && { diagnosisId }),
      ...(diagnosisName && { 
        diagnosisName: { contains: diagnosisName, mode: 'insensitive' } 
      }),
      ...(version && { version })
    };

    const [plans, total] = await Promise.all([
      this.db.plan.findMany({
        where,
        orderBy: { crDate: sort },
        skip: offset,
        take: limit,
        include: {
          diagnosis_master_plan_diagnosisIdTodiagnosis_master: {
            select: {
              id: true,
              name: true,
              bodyArea: true
            }
          }
        }
      }),
      this.db.plan.count({ where })
    ]);

    return {
      data: plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get treatment plan by ID
   */
  async getPlanById(id: number, clientId: number) {
    return await this.db.plan.findFirst({
      where: { 
        id, 
        clientId 
      },
      include: {
        diagnosis_master_plan_diagnosisIdTodiagnosis_master: {
          select: {
            id: true,
            name: true,
            bodyArea: true
          }
        }
      }
    });
  }

  /**
   * Update treatment plan
   */
  async updatePlan(id: number, data: UpdatePlanData, clientId: number, modUser: string) {
    return await this.db.plan.update({
      where: { 
        id,
        clientId 
      },
      data: {
        ...data,
        modUser,
        modDate: new Date(),
      }
    });
  }

  /**
   * Delete treatment plan
   */
  async deletePlan(id: number, clientId: number) {
    return await this.db.plan.delete({
      where: { 
        id,
        clientId 
      }
    });
  }

  // ===================================================================
  // 🎯 PATIENT PLAN OPERATIONS
  // ===================================================================

  /**
   * Create a new patient plan
   */
  async createPatientPlan(data: CreatePatientPlanData & { clientId: number; crUser: string; modUser: string }) {
    return await this.db.patient_plan.create({
      data: {
        ...data,
        crDate: new Date(),
        modDate: new Date(),
      }
    });
  }

  /**
   * Get patient plans with filters and pagination
   */
  async getPatientPlans(filters: PatientPlanFilters, clientId: number) {
    const {
      page = 1,
      limit = 10,
      search,
      patientId,
      surgeonId,
      diagnosisId,
      planId,
      surgeryDate,
      literality,
      sort = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.patient_planWhereInput = {
      clientId,
      ...(search && {
        OR: [
          { user_patient_plan_patientIdTouser: { firstName: { contains: search, mode: 'insensitive' } } },
          { user_patient_plan_patientIdTouser: { lastName: { contains: search, mode: 'insensitive' } } },
          { plan: { name: { contains: search, mode: 'insensitive' } } }
        ]
      }),
      ...(patientId && { patientId }),
      ...(surgeonId && { surgeonId }),
      ...(diagnosisId && { diagnosisId }),
      ...(planId && { planId }),
      ...(surgeryDate && { 
        surgeryDate: {
          gte: new Date(surgeryDate),
          lt: new Date(new Date(surgeryDate).getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      ...(literality && { literality: literality as any })
    };

    const [patientPlans, total] = await Promise.all([
      this.db.patient_plan.findMany({
        where,
        orderBy: { crDate: sort },
        skip: offset,
        take: limit,
        include: {
          user_patient_plan_patientIdTouser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              diagnosisName: true
            }
          },
          diagnosis_master_patient_plan_diagnosisIdTodiagnosis_master: {
            select: {
              id: true,
              name: true,
              bodyArea: true
            }
          }
        }
      }),
      this.db.patient_plan.count({ where })
    ]);

    return {
      data: patientPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get patient plan by ID
   */
  async getPatientPlanById(id: number, clientId: number) {
    return await this.db.patient_plan.findFirst({
      where: { 
        id, 
        clientId 
      },
      include: {
        user_patient_plan_patientIdTouser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            diagnosisName: true,
            model: true
          }
        },
        diagnosis_master_patient_plan_diagnosisIdTodiagnosis_master: {
          select: {
            id: true,
            name: true,
            bodyArea: true
          }
        }
      }
    });
  }

  /**
   * Update patient plan
   */
  async updatePatientPlan(id: number, data: UpdatePatientPlanData, clientId: number, modUser: string) {
    return await this.db.patient_plan.update({
      where: { 
        id,
        clientId 
      },
      data: {
        ...data,
        modUser,
        modDate: new Date(),
      }
    });
  }

  /**
   * Delete patient plan
   */
  async deletePatientPlan(id: number, clientId: number) {
    return await this.db.patient_plan.delete({
      where: { 
        id,
        clientId 
      }
    });
  }

  // ===================================================================
  // 🎯 PATIENT PLAN SCHEDULE OPERATIONS
  // ===================================================================

  /**
   * Create a new patient plan schedule
   */
  async createSchedule(data: CreateScheduleData & { clientId: number; crUser: string; modUser: string }) {
    return await this.db.patient_plan_schedule.create({
      data: {
        ...data,
        crDate: new Date(),
        modDate: new Date(),
      }
    });
  }

  /**
   * Get patient plan schedules with filters and pagination
   */
  async getSchedules(filters: ScheduleFilters, clientId: number) {
    const {
      page = 1,
      limit = 10,
      patientId,
      planId,
      type,
      scheduleDate,
      status,
      sort = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.patient_plan_scheduleWhereInput = {
      clientId,
      ...(patientId && { patientId }),
      ...(planId && { planID: planId }),
      ...(type && { type: type as any }),
      ...(scheduleDate && { 
        scheduleDate: {
          gte: new Date(scheduleDate),
          lt: new Date(new Date(scheduleDate).getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      ...(status && { status: status === 'true' })
    };

    const [schedules, total] = await Promise.all([
      this.db.patient_plan_schedule.findMany({
        where,
        orderBy: { scheduleDate: sort },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          patient_plan: {
            select: {
              id: true,
              plan: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      this.db.patient_plan_schedule.count({ where })
    ]);

    return {
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get patient plan schedule by ID
   */
  async getScheduleById(id: number, clientId: number) {
    return await this.db.patient_plan_schedule.findFirst({
      where: { 
        id, 
        clientId 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        patient_plan: {
          select: {
            id: true,
            plan: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update patient plan schedule
   */
  async updateSchedule(id: number, data: UpdateScheduleData, clientId: number, modUser: string) {
    return await this.db.patient_plan_schedule.update({
      where: { 
        id,
        clientId 
      },
      data: {
        ...data,
        modUser,
        modDate: new Date(),
      }
    });
  }

  /**
   * Delete patient plan schedule
   */
  async deleteSchedule(id: number, clientId: number) {
    return await this.db.patient_plan_schedule.delete({
      where: { 
        id,
        clientId 
      }
    });
  }

  // ===================================================================
  // 🎯 PATIENT PLAN SCHEDULE LOG OPERATIONS
  // ===================================================================

  /**
   * Create a new schedule log entry
   */
  async createScheduleLog(data: CreateScheduleLogData & { clientId: number; crUser: string; modUser: string }) {
    return await this.db.patient_plan_schedule_log.create({
      data: {
        ...data,
        crDate: new Date(),
        modDate: new Date(),
      }
    });
  }

  /**
   * Get schedule logs with filters and pagination
   */
  async getScheduleLogs(filters: ScheduleLogFilters, clientId: number) {
    const {
      page = 1,
      limit = 10,
      scheduleId,
      patientId,
      startDate,
      endDate,
      sort = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.patient_plan_schedule_logWhereInput = {
      clientId,
      ...(scheduleId && { patientPlanScheduleId: scheduleId }),
      ...(patientId && { patientId }),
      ...(startDate && endDate && {
        scheduleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [logs, total] = await Promise.all([
      this.db.patient_plan_schedule_log.findMany({
        where,
        orderBy: { scheduleDate: sort },
        skip: offset,
        take: limit,
        include: {
          patient_plan_schedule: {
            select: {
              id: true,
              type: true,
              scheduleDate: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      this.db.patient_plan_schedule_log.count({ where })
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get schedule log by ID
   */
  async getScheduleLogById(id: number, clientId: number) {
    return await this.db.patient_plan_schedule_log.findFirst({
      where: { 
        id, 
        clientId 
      },
      include: {
        patient_plan_schedule: {
          select: {
            id: true,
            type: true,
            scheduleDate: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Update schedule log
   */
  async updateScheduleLog(id: number, data: UpdateScheduleLogData, currentUser: { id: number; username: string }) {
    return await this.db.patient_plan_schedule_log.update({
      where: { id },
      data: {
        ...data,
        modUser: currentUser.username,
        modDate: new Date()
      },
      include: {
        patient_plan_schedule: {
          select: {
            id: true,
            type: true,
            scheduleDate: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Delete schedule log
   */
  async deleteScheduleLog(id: number) {
    return await this.db.patient_plan_schedule_log.delete({
      where: { id }
    });
  }

  /**
   * Check if schedule entry exists for patient
   */
  async checkScheduleExists(scheduleId: number, patientId: number, clientId: number) {
    const count = await this.db.patient_plan_schedule_log.count({
      where: {
        patientPlanScheduleId: scheduleId,
        patientId,
        clientId
      }
    });
    return count > 0;
  }
}
