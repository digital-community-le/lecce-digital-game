// Avatar management system with local preset images
import developer from '@assets/generated_images/Developer_avatar_pixel_art_a2515cc8.png';
import femDeveloper from '@assets/generated_images/Female_developer_avatar_pixel_20b982fb.png';
import designer from '@assets/generated_images/Designer_avatar_pixel_art_50737636.png';
import femDesigner from '@assets/generated_images/Female_designer_avatar_pixel_a849bc52.png';
import manager from '@assets/generated_images/Manager_avatar_pixel_art_1555a05c.png';
import scientist from '@assets/generated_images/Scientist_avatar_pixel_art_eac1695c.png';
import astronaut from '@assets/generated_images/Astronaut_avatar_pixel_art_ccc99934.png';
import femAstronaut from '@assets/generated_images/Female_astronaut_avatar_pixel_e4c47009.png';
import teacher from '@assets/generated_images/Teacher_avatar_pixel_art_c32e4d73.png';
import femTeacher from '@assets/generated_images/Female_teacher_avatar_pixel_2ede18a1.png';
import student from '@assets/generated_images/Student_avatar_pixel_art_285fb9d0.png';
import coder from '@assets/generated_images/Coder_avatar_pixel_art_a9e88700.png';

export const AVATAR_PRESETS = [
  { id: 'developer', name: 'Sviluppatore', url: developer },
  { id: 'fem-developer', name: 'Sviluppatrice', url: femDeveloper },
  { id: 'designer', name: 'Designer', url: designer },
  { id: 'fem-designer', name: 'Designer', url: femDesigner },
  { id: 'manager', name: 'Project Manager', url: manager },
  { id: 'scientist', name: 'Data Scientist', url: scientist },
  { id: 'astronaut', name: 'Astronauta', url: astronaut },
  { id: 'fem-astronaut', name: 'Astronauta', url: femAstronaut },
  { id: 'teacher', name: 'Insegnante', url: teacher },
  { id: 'fem-teacher', name: 'Insegnante', url: femTeacher },
  { id: 'student', name: 'Studente', url: student },
  { id: 'coder', name: 'Coder', url: coder },
];

export const getAvatarById = (id: string): string => {
  const avatar = AVATAR_PRESETS.find(a => a.id === id);
  return avatar?.url || developer; // Default fallback
};

export const getRandomAvatar = (): { id: string; url: string } => {
  const randomIndex = Math.floor(Math.random() * AVATAR_PRESETS.length);
  const avatar = AVATAR_PRESETS[randomIndex];
  return { id: avatar.id, url: avatar.url };
};