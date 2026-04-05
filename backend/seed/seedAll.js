// backend/seed/seedAll.js
// Master seed runner — runs all 3 seed parts in order
// Usage: node backend/seed/seedAll.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import { LearningCourse } from '../models/learningMaterialModel.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

// Import all course data from parts
import { getCourses as getPart1 } from './seedPart1Export.js';
import { getCourses as getPart2 } from './seedPart2Export.js';
import { getCourses as getPart3 } from './seedPart3Export.js';

const seedAll = async () => {
  try {
    await connectDB();
    console.log('🌱  Starting full LMS seed...\n');

    // Clear existing data
    const deleted = await LearningCourse.deleteMany({}).maxTimeMS(60000);
    console.log(`🗑   Cleared ${deleted.deletedCount} existing courses.\n`);

    const allCourses = [
      ...getPart1(),
      ...getPart2(),
      ...getPart3(),
    ];

    let totalModules = 0;
    let totalExamQ   = 0;

    for (const course of allCourses) {
      const created = await LearningCourse.create(course);
      const mCount = course.modules.length;
      const eCount = course.exam ? course.exam.length : 0;
      totalModules += mCount;
      totalExamQ   += eCount;
      console.log(`✅  [${course.level.toUpperCase()}] ${created.title}`);
      console.log(`    ${mCount} modules | ${eCount} exam questions | passing: ${course.passingScore}%`);
    }

    console.log('\n════════════════════════════════════════');
    console.log(`🎉  SEED COMPLETE`);
    console.log(`📚  Total courses:          ${allCourses.length}`);
    console.log(`📖  Total modules:          ${totalModules}`);
    console.log(`📝  Total exam questions:   ${totalExamQ}`);
    console.log(`✅  Required courses:       ${allCourses.filter(c => c.required).length}`);
    console.log(`⭐  Beginner courses:       ${allCourses.filter(c => c.level === 'beginner').length}`);
    console.log(`📈  Intermediate courses:   ${allCourses.filter(c => c.level === 'intermediate').length}`);
    console.log(`🎓  Expert courses:         ${allCourses.filter(c => c.level === 'expert').length}`);
    console.log('════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌  Seed error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedAll();