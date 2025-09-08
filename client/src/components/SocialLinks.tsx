import FacebookIcon from '@/assets/images/facebook.svg';
import InstagramIcon from '@/assets/images/instagram.svg';
import WhatsappIcon from '@/assets/images/whatsapp.svg';

const SocialLinks = () => {
  return (
    <div>
      <div className="font-semibold text-white text-sm leading-none">
        Seguici sui social
      </div>
      <div className="flex justify-center gap-4 mt-1">
        <div>
          <a
            href="https://www.instagram.com/lecce_digital_community/"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={InstagramIcon} alt="Instagram Digital Community Lecce" />
          </a>
        </div>
        <div>
          <a
            href="https://www.facebook.com/groups/leccedigitalcommunity"
            aria-label="Facebook"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={FacebookIcon} alt="Facebook Digital Community Lecce" />
          </a>
        </div>
        <div>
          <a
            href="https://chat.whatsapp.com/DM5VwweGi7h5lkJK3xQHEj?mode=ems_copy_t"
            aria-label="Whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={WhatsappIcon} alt="Whatsapp Digital Community Lecce" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SocialLinks;
